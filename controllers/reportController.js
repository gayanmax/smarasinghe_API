// controller/reportController.js

const db = require('../db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

// Helper: Format date to YYYY-MM-DD using LOCAL time to avoid timezone shifts
function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleDateString('en-CA');
}

exports.getReportData = async (req, res) => {
    const { method, month_range, year } = req.body;

    if (!method) return res.status(400).json({ message: "Method is required" });

    try {
        // ----------- DAILY -----------
        if (method === "daily") {
            const selectedDate = req.body.date ? formatDate(req.body.date) : formatDate(new Date());

            // 1. Fetch Combined Bills for the list and payment totals
            const bills = await query(`
                SELECT combined.*, users.user_name AS billed_by
                FROM (
                    SELECT payment_method, amount, bill_date, billed_by FROM billing 
                    WHERE is_claimer_bill = 0 AND DATE(bill_date) = ?
                    UNION ALL
                    SELECT payment_method, amount, bill_date, billed_by FROM temp_billing 
                    WHERE DATE(bill_date) = ?
                ) AS combined
                LEFT JOIN users ON users.user_id = combined.billed_by
            `, [selectedDate, selectedDate]);

            // 2. Fetch Expenses, Jobs, and Customers
            const expenses = await query(`
                SELECT d.*, u.user_name AS expenses_by 
                FROM daily_expenses d 
                LEFT JOIN users u ON d.expenses_by = u.user_id 
                WHERE DATE(date_time) = ?
            `, [selectedDate]);

            const jobCount = await query(`SELECT COUNT(*) AS count FROM job WHERE DATE(create_date) = ?`, [selectedDate]);
            const custCount = await query(`SELECT COUNT(*) AS count FROM customers WHERE DATE(create_date) = ?`, [selectedDate]);

            // Calculate daily totals
            const payment_totals = { cash: 0, visa: 0, online: 0, bank: 0 };
            let billing_total = 0;

            bills.forEach(bill => {
                const amt = parseFloat(bill.amount || 0);
                billing_total += amt;
                if (bill.payment_method === "Cash") payment_totals.cash += amt;
                else if (bill.payment_method === "Visa Card") payment_totals.visa += amt;
                else if (bill.payment_method === "Online Payment") payment_totals.online += amt;
                else if (bill.payment_method === "Bank Payment") payment_totals.bank += amt;
            });

            return res.status(200).json({
                date: selectedDate,
                bills,
                bill_count: bills.length,
                billing_total,
                payment_totals,
                expenses,
                expenses_total: expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
                jobs_created_today: jobCount[0].count,
                customers_created_today: custCount[0].count
            });
        }

        // ----------- WEEKLY & MONTHLY -----------
        if (method === "weekly" || method === "monthly") {
            let startDate, endDate;

            if (method === "weekly") {
                const today = new Date();
                const start = new Date();
                start.setDate(today.getDate() - 6);
                startDate = formatDate(start);
                endDate = formatDate(today);
            } else {
                const parts = (month_range || "").split("|");
                if (parts.length !== 2) return res.status(400).json({ message: "Invalid month_range" });
                [startDate, endDate] = parts;
            }

            // 1. Combined Bill Data Grouped by Day
            const billRows = await query(`
                SELECT 
                    DATE(bill_date) AS day, 
                    SUM(amount) AS total,
                    SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END) AS cash_total,
                    SUM(CASE WHEN payment_method = 'Visa Card' THEN amount ELSE 0 END) AS visa_total,
                    SUM(CASE WHEN payment_method = 'Online Payment' THEN amount ELSE 0 END) AS online_total,
                    SUM(CASE WHEN payment_method = 'Bank Payment' THEN amount ELSE 0 END) AS bank_total
                FROM (
                    SELECT bill_date, amount, payment_method FROM billing 
                    WHERE is_claimer_bill = 0 AND DATE(bill_date) BETWEEN ? AND ?
                    UNION ALL
                    SELECT bill_date, amount, payment_method FROM temp_billing 
                    WHERE DATE(bill_date) BETWEEN ? AND ?
                ) AS combined_range
                GROUP BY DATE(bill_date)
            `, [startDate, endDate, startDate, endDate]);

            // 2. Expenses and other counts
            const expRows = await query(`
                SELECT DATE(date_time) AS day, SUM(amount) AS total 
                FROM daily_expenses 
                WHERE DATE(date_time) BETWEEN ? AND ? 
                GROUP BY DATE(date_time)
            `, [startDate, endDate]);

            const totals = billRows.reduce((acc, r) => {
                acc.billing_total += parseFloat(r.total);
                acc.payment_totals.cash += parseFloat(r.cash_total);
                acc.payment_totals.visa += parseFloat(r.visa_total);
                acc.payment_totals.online += parseFloat(r.online_total);
                acc.payment_totals.bank += parseFloat(r.bank_total);
                return acc;
            }, { billing_total: 0, payment_totals: { cash: 0, visa: 0, online: 0, bank: 0 } });

            return res.status(200).json({
                range: { start: startDate, end: endDate },
                bills: billRows,
                ...totals,
                expenses: expRows,
                expenses_total: expRows.reduce((s, r) => s + parseFloat(r.total || 0), 0)
            });
        }

        // ----------- ANNUALLY -----------
        if (method === "annually") {
            if (!year) return res.status(400).json({ message: "Year required" });

            const billRows = await query(`
                SELECT 
                    MONTH(bill_date) AS month, 
                    SUM(amount) AS total,
                    SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END) AS cash_total,
                    SUM(CASE WHEN payment_method = 'Visa Card' THEN amount ELSE 0 END) AS visa_total,
                    SUM(CASE WHEN payment_method = 'Online Payment' THEN amount ELSE 0 END) AS online_total,
                    SUM(CASE WHEN payment_method = 'Bank Payment' THEN amount ELSE 0 END) AS bank_total
                FROM (
                    SELECT bill_date, amount, payment_method FROM billing 
                    WHERE is_claimer_bill = 0 AND YEAR(bill_date) = ?
                    UNION ALL
                    SELECT bill_date, amount, payment_method FROM temp_billing 
                    WHERE YEAR(bill_date) = ?
                ) AS combined_year
                GROUP BY MONTH(bill_date)
            `, [year, year]);

            const totals = billRows.reduce((acc, r) => {
                acc.billing_total += parseFloat(r.total);
                acc.payment_totals.cash += parseFloat(r.cash_total);
                acc.payment_totals.visa += parseFloat(r.visa_total);
                acc.payment_totals.online += parseFloat(r.online_total);
                acc.payment_totals.bank += parseFloat(r.bank_total);
                return acc;
            }, { billing_total: 0, payment_totals: { cash: 0, visa: 0, online: 0, bank: 0 } });

            return res.status(200).json({
                year,
                bills: billRows,
                ...totals
            });
        }

    } catch (err) {
        console.error("Report Error:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

exports.createReportLog = (req, res) => {

    const created_by = req.user?.user_id;
    const { type, range } = req.body;

    // Basic validation
    if (!created_by) {
        return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!type || !range) {
        return res.status(400).json({ message: "Report type and range are required" });
    }

    const sql = `
        INSERT INTO reports (create_date, created_by, report_range, report_type)
        VALUES (NOW(), ?, ?, ?)
    `;

    db.query(sql, [created_by, range, type], (err, result) => {
        if (err) {
            console.error("Report log insert error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        return res.status(201).json({
            message: "Report log created successfully",
            report_id: result.insertId
        });
    });
};

exports.getDeductReport = (req, res) => {
    const { fromDate, toDate, mode } = req.body;

    if (!fromDate || !toDate) {
        return res.status(400).json({ message: "fromDate and toDate are required." });
    }

    const billsQuery = `
        SELECT bill_id, job_id, amount, payment_method, bill_date, payment_status, bill_type
        FROM billing
        WHERE DATE(bill_date) BETWEEN ? AND ?
    `;

    db.query(billsQuery, [fromDate, toDate], (err, bills) => {
        if (err) {
            return res.status(500).json({ message: "Database error while fetching bills." });
        }

        // ================= NORMAL =================
        if (mode === "normal") {

            let totalAmount = 0;
            bills.forEach(b => totalAmount += Number(b.amount));

            return res.json({
                range: { fromDate, toDate },
                bills: bills.map(b => ({
                    bill_id: b.bill_id,
                    job_id: b.job_id,
                    amount: b.amount,
                    payment_method: b.payment_method,
                    bill_type: b.bill_type,
                    bill_date: b.bill_date
                })),
                total_amount: totalAmount,
                bill_count: bills.length
            });

        }
        // ================= DEDUCTED =================
        else if (mode === "deducted") {

            // Get bill IDs where payment_status = 2
            const billIdsToCheck = bills
                .filter(b => b.payment_status === 2)
                .map(b => b.bill_id);

            // If no deducted bills, just return normal bills
            if (billIdsToCheck.length === 0) {

                let totalAmount = 0;
                bills.forEach(b => totalAmount += Number(b.amount));

                return res.json({
                    range: { fromDate, toDate },
                    bills: bills.map(b => ({
                        bill_id: b.bill_id,
                        job_id: b.job_id,
                        amount: b.amount,
                        payment_method: b.payment_method,
                        bill_type: b.bill_type,
                        bill_date: b.bill_date
                    })),
                    total_amount: totalAmount,
                    bill_count: bills.length
                });
            }

            const deductionQuery = `
                SELECT bill_id, amount
                FROM billing_deduction
                WHERE bill_id IN (?)
            `;

            db.query(deductionQuery, [billIdsToCheck], (err2, deductions) => {
                if (err2) {
                    return res.status(500).json({ message: "Database error while fetching deductions." });
                }

                // Create map of deducted amounts
                const deductionMap = {};
                deductions.forEach(d => {
                    deductionMap[d.bill_id] = Number(d.amount);
                });

                let totalAmount = 0;

                const finalBills = bills.map(b => {

                    let finalAmount = Number(b.amount);

                    // If payment_status === 2 and deduction exists → replace amount
                    if (b.payment_status === 2 && deductionMap[b.bill_id] !== undefined) {
                        finalAmount = deductionMap[b.bill_id];
                    }

                    totalAmount += finalAmount;

                    return {
                        bill_id: b.bill_id,
                        job_id: b.job_id,
                        amount: finalAmount,
                        payment_method: b.payment_method,
                        bill_type: b.bill_type,
                        bill_date: b.bill_date
                    };
                });

                return res.json({
                    range: { fromDate, toDate },
                    bills: finalBills,
                    total_amount: totalAmount,
                    bill_count: finalBills.length
                });
            });
        }
        else {
            return res.status(400).json({ message: "Invalid mode. Use 'normal' or 'deducted'." });
        }
    });
};