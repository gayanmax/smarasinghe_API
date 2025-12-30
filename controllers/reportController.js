// controller/reportController.js

const db = require('../db');

// ---------------------- Helper: date format ----------------------
function formatDate(d) {
    return d.toISOString().split("T")[0];
}

// ---------------------- Helper: run query wrapper ----------------------
function runQuery(sql, params, cb) {
    db.query(sql, params, (err, rows) => {
        if (err) return cb(err);
        cb(null, rows);
    });
}

// ---------------------- MAIN FUNCTION ----------------------
exports.getReportData = (req, res) => {
    const { method, month_range, year } = req.body;

    if (!method) {
        return res.status(400).json({ message: "Method is required" });
    }

// ----------- DAILY -----------
    if (method === "daily") {
        const today = formatDate(new Date());
        const result = {};

        // 1) bills (exclude claims)
        const billsSQL = `
        SELECT SQL_CALC_FOUND_ROWS
        billing.*,
        users.user_name AS billed_by
        FROM billing
        LEFT JOIN users ON users.user_id = billing.billed_by
        WHERE DATE(bill_date) = ?
        AND billing.bill_type != 'claim'
    `;

        runQuery(billsSQL, [today], (err, bills) => {
            if (err) return res.status(500).json({ message: "DB error bills" });

            result.bills = bills;
            result.bill_count = bills.length;

            // total billing amount
            result.total_billing_amount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);

            // 2) expenses
            const expSQL = `
                SELECT SQL_CALC_FOUND_ROWS
                d.expenses_id,
                    d.amount,
                    d.reason,
                    u.user_name AS expenses_by
                FROM daily_expenses d
                LEFT JOIN users u
                ON d.expenses_by = u.user_id
                WHERE DATE(date_time) = ?
            `;

            runQuery(expSQL, [today], (err2, expenses) => {
                if (err2) return res.status(500).json({ message: "DB error expenses" });

                result.expenses = expenses;
                result.expense_count = expenses.length;

                // total expenses amount
                result.total_expenses_amount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

                // 3) job count
                const jobSQL = `
                SELECT COUNT(*) AS job_count
                FROM job
                WHERE DATE(create_date) = ?
            `;

                runQuery(jobSQL, [today], (err3, jobRows) => {
                    if (err3) return res.status(500).json({ message: "DB error jobs" });

                    result.jobs_created_today = jobRows[0].job_count;

                    // 4) customer count
                    const custSQL = `
                    SELECT COUNT(*) AS customer_count
                    FROM customers
                    WHERE DATE(create_date) = ?
                `;

                    runQuery(custSQL, [today], (err4, custRows) => {
                        if (err4) return res.status(500).json({ message: "DB error customers" });

                        result.customers_created_today = custRows[0].customer_count;

                        return res.status(200).json(result);
                    });
                });
            });
        });

        return;
    }

    // --------------------------------------------------------------------
    // --------------------------- WEEKLY ---------------------------------
    // --------------------------------------------------------------------
    if (method === "weekly") {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - 6);

        const startDate = formatDate(start);
        const endDate = formatDate(today);

        const result = {
            range: { start: startDate, end: endDate }
        };

        // total bills & per day
        const billSQL = `
            SELECT DATE(bill_date) AS day, SUM(amount) AS total
            FROM billing
            WHERE bill_type <> 'claim'
              AND DATE(bill_date) BETWEEN ? AND ?
            GROUP BY DATE(bill_date)
        `;

        runQuery(billSQL, [startDate, endDate], (err, billRows) => {
            if (err) return res.status(500).json({ message: "DB error weekly bills" });

            let total = 0;
            billRows.forEach(r => total += r.total || 0);

            result.billing_total = total;
            result.billing_per_day = billRows;

            // expenses
            const expSQL = `
                SELECT DATE(date_time) AS day, SUM(amount) AS total
                FROM daily_expenses
                WHERE DATE(date_time) BETWEEN ? AND ?
                GROUP BY DATE(date_time)
            `;

            runQuery(expSQL, [startDate, endDate], (err2, expRows) => {
                if (err2) return res.status(500).json({ message: "DB error weekly expenses" });

                let total2 = 0;
                expRows.forEach(r => total2 += r.total || 0);

                result.expenses_total = total2;
                result.expenses_per_day = expRows;

                // customers
                const custSQL = `
                    SELECT DATE(create_date) AS day, COUNT(*) AS total
                    FROM customers
                    WHERE DATE(create_date) BETWEEN ? AND ?
                    GROUP BY DATE(create_date)
                `;

                runQuery(custSQL, [startDate, endDate], (err3, custRows) => {
                    if (err3) return res.status(500).json({ message: "DB error weekly customers" });

                    result.customers = custRows;

                    // jobs
                    const jobSQL = `
                        SELECT DATE(create_date) AS day, COUNT(*) AS total
                        FROM job
                        WHERE DATE(create_date) BETWEEN ? AND ?
                        GROUP BY DATE(create_date)
                    `;

                    runQuery(jobSQL, [startDate, endDate], (err4, jobRows) => {
                        if (err4) return res.status(500).json({ message: "DB error weekly jobs" });

                        result.jobs = jobRows;

                        return res.status(200).json(result);
                    });
                });
            });
        });

        return;
    }

    // --------------------------------------------------------------------
    // --------------------------- MONTHLY --------------------------------
    // --------------------------------------------------------------------
    if (method === "monthly") {
        // month_range example => "2025-01-01|2025-01-31"
        const parts = (month_range || "").split("|");

        if (parts.length !== 2) {
            return res.status(400).json({ message: "Invalid month_range" });
        }

        const startDate = parts[0];
        const endDate = parts[1];

        const result = { range: { start: startDate, end: endDate } };

        const billSQL = `
            SELECT DATE(bill_date) AS day, SUM(amount) AS total
            FROM billing
            WHERE bill_type <> 'claim'
              AND DATE(bill_date) BETWEEN ? AND ?
            GROUP BY DATE(bill_date)
        `;

        runQuery(billSQL, [startDate, endDate], (err, billRows) => {
            if (err) return res.status(500).json({ message: "DB error monthly bills" });

            let total = 0;
            billRows.forEach(r => total += r.total || 0);

            result.billing_total = total;
            result.billing_per_day = billRows;

            const expSQL = `
                SELECT DATE(date_time) AS day, SUM(amount) AS total
                FROM daily_expenses
                WHERE DATE(date_time) BETWEEN ? AND ?
                GROUP BY DATE(date_time)
            `;

            runQuery(expSQL, [startDate, endDate], (err2, expRows) => {
                if (err2) return res.status(500).json({ message: "DB error monthly expenses" });

                let total2 = 0;
                expRows.forEach(r => total2 += r.total || 0);

                result.expenses_total = total2;
                result.expenses_per_day = expRows;

                // customers
                const custSQL = `
                    SELECT DATE(create_date) AS day, COUNT(*) AS total
                    FROM customers
                    WHERE DATE(create_date) BETWEEN ? AND ?
                    GROUP BY DATE(create_date)
                `;

                runQuery(custSQL, [startDate, endDate], (err3, custRows) => {
                    if (err3) return res.status(500).json({ message: "DB error monthly customers" });

                    result.customers = custRows;

                    // jobs
                    const jobSQL = `
                        SELECT DATE(create_date) AS day, COUNT(*) AS total
                        FROM job
                        WHERE DATE(create_date) BETWEEN ? AND ?
                        GROUP BY DATE(create_date)
                    `;

                    runQuery(jobSQL, [startDate, endDate], (err4, jobRows) => {
                        if (err4) return res.status(500).json({ message: "DB error monthly jobs" });

                        result.jobs = jobRows;

                        return res.status(200).json(result);
                    });
                });
            });
        });

        return;
    }

    // --------------------------------------------------------------------
    // --------------------------- ANNUALLY -------------------------------
    // --------------------------------------------------------------------
    if (method === "annually") {

        const selectedYear = year;

        if (!selectedYear) {
            return res.status(400).json({ message: "Year required" });
        }

        const result = { year: selectedYear };

        const billSQL = `
            SELECT MONTH(bill_date) AS month, SUM(amount) AS total
            FROM billing
            WHERE YEAR(bill_date) = ?
              AND bill_type <> 'claim'
            GROUP BY MONTH(bill_date)
        `;

        runQuery(billSQL, [selectedYear], (err, billRows) => {
            if (err) return res.status(500).json({ message: "DB error annual bills" });

            let total = 0;
            billRows.forEach(r => total += r.total || 0);

            result.billing_total = total;
            result.billing_per_month = billRows;

            const expSQL = `
                SELECT MONTH(date_time) AS month, SUM(amount) AS total
                FROM daily_expenses
                WHERE YEAR(date_time) = ?
                GROUP BY MONTH(date_time)
            `;

            runQuery(expSQL, [selectedYear], (err2, expRows) => {
                if (err2) return res.status(500).json({ message: "DB error annual expenses" });

                let total2 = 0;
                expRows.forEach(r => total2 += r.total || 0);

                result.expenses_total = total2;
                result.expenses_per_month = expRows;

                // customers
                const custSQL = `
                    SELECT MONTH(create_date) AS month, COUNT(*) AS total
                    FROM customers
                    WHERE YEAR(create_date) = ?
                    GROUP BY MONTH(create_date)
                `;

                runQuery(custSQL, [selectedYear], (err3, custRows) => {
                    if (err3) return res.status(500).json({ message: "DB error annual customers" });

                    result.customers = custRows;

                    // jobs
                    const jobSQL = `
                        SELECT MONTH(create_date) AS month, COUNT(*) AS total
                        FROM job
                        WHERE YEAR(create_date) = ?
                        GROUP BY MONTH(create_date)
                    `;

                    runQuery(jobSQL, [selectedYear], (err4, jobRows) => {
                        if (err4) return res.status(500).json({ message: "DB error annual jobs" });

                        result.jobs = jobRows;

                        return res.status(200).json(result);
                    });
                });
            });
        });

        return;
    }

    return res.status(400).json({ message: "Invalid method" });
};
