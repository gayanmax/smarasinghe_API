const db = require('../db');
const util = require('util');

// Promisify the query function for cleaner async/await usage
const query = util.promisify(db.query).bind(db);

exports.getDashboardData = async (req, res) => {
    try {
        // We run these in parallel to save time
        const [
            metrics,
            pieData,
            weeklyIncome,
            weeklyExpenses
        ] = await Promise.all([
            // 1. Single query for all basic counts & daily expense
            query(`
                SELECT 
                    (SELECT COUNT(*) FROM customers WHERE DATE(create_date) = CURDATE()) AS dailyCustomers,
                    (SELECT COUNT(*) FROM job WHERE DATE(create_date) = CURDATE()) AS dailyJobs,
                    (SELECT COUNT(*) FROM job WHERE order_status = 1) AS pendingJobs,
                    (SELECT COUNT(*) FROM job WHERE order_status = 2) AS readyJobs,
                    (SELECT IFNULL(SUM(amount), 0) FROM daily_expenses WHERE DATE(date_time) = CURDATE()) AS dailyExpenseTotal
            `),

            // 2. Today's Pie Chart Data (Combined Billing)
            query(`
                SELECT payment_method, SUM(amount) as total
                FROM (
                    SELECT payment_method, amount FROM billing 
                    WHERE DATE(bill_date) = CURDATE() AND is_claimer_bill = 0
                    UNION ALL
                    SELECT payment_method, amount FROM temp_billing 
                    WHERE DATE(bill_date) = CURDATE()
                ) AS combined_today
                GROUP BY payment_method
            `),

            // 3. Weekly Income (Last 7 days)
            query(`
                SELECT DATE(bill_date) as date, SUM(amount) as total_income
                FROM (
                    SELECT bill_date, amount FROM billing 
                    WHERE bill_date >= CURDATE() - INTERVAL 6 DAY AND is_claimer_bill = 0
                    UNION ALL
                    SELECT bill_date, amount FROM temp_billing 
                    WHERE bill_date >= CURDATE() - INTERVAL 6 DAY
                ) AS combined_week
                GROUP BY DATE(bill_date)
            `),

            // 4. Weekly Expenses (Last 7 days)
            query(`
                SELECT DATE(date_time) as date, SUM(amount) as total_expense
                FROM daily_expenses
                WHERE date_time >= CURDATE() - INTERVAL 6 DAY
                GROUP BY DATE(date_time)
            `)
        ]);

        // --- Process Today's Pie Chart ---
        const paymentMethods = ["Cash", "Visa Card", "Online Payment", "Bank Payment"];
        const todaySeries = paymentMethods.map(method => {
            const found = pieData.find(item => item.payment_method === method);
            return found ? parseFloat(found.total) : 0;
        });

        // --- Process Weekly Area Chart ---
        const categories = [];
        const incomeSeries = [];
        const expenseSeries = [];
        const diffSeries = [];

        for (let i = 6; i >= 0; i--) {
            const dateObj = new Date();
            dateObj.setDate(dateObj.getDate() - i);

            // 'en-CA' format gives YYYY-MM-DD based on LOCAL time, not UTC
            const dateStr = dateObj.toLocaleDateString('en-CA');
            const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

            // Helper to match DB date with local date string
            const findDataByDate = (arr, targetDate, key) => {
                const found = arr.find(row => {
                    // Ensure we compare YYYY-MM-DD to YYYY-MM-DD
                    const dbDate = new Date(row.date).toLocaleDateString('en-CA');
                    return dbDate === targetDate;
                });
                return found ? parseFloat(found[key]) : 0;
            };

            const dayInc = findDataByDate(weeklyIncome, dateStr, 'total_income');
            const dayExp = findDataByDate(weeklyExpenses, dateStr, 'total_expense');

            categories.push(label);
            incomeSeries.push(dayInc);
            expenseSeries.push(dayExp);
            diffSeries.push(dayInc - dayExp);
        }

        // Final Response Object
        res.status(200).json({
            success: true,
            data: {
                dailyCustomers: metrics[0].dailyCustomers,
                dailyJobs: metrics[0].dailyJobs,
                pendingJobs: metrics[0].pendingJobs,
                readyJobs: metrics[0].readyJobs,
                dailyExpenseTotal: metrics[0].dailyExpenseTotal,
                todayChartData: {
                    labels: paymentMethods,
                    series: todaySeries
                },
                weekChartData: {
                    categories,
                    series: [
                        { name: "Income", data: incomeSeries },
                        { name: "Expenses", data: expenseSeries },
                        { name: "Difference", data: diffSeries }
                    ]
                }
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};