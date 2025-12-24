const db = require("../db");

exports.createExpense = (req, res) => {
    const { amount, reason } = req.body;
    const expenses_by = req.user && req.user.user_id;

    // Basic validation
    const errors = {};

    if (!amount && amount !== 0) {
        errors.amount = "Amount is required";
    } else if (isNaN(amount)) {
        errors.amount = "Amount must be numeric";
    }

    if (!reason || reason.trim() === "") {
        errors.reason = "Reason is required";
    }

    if (!expenses_by) {
        errors.expenses_by = "Logged user not found";
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ status: 400, errors });
    }

    const insertSql = `
        INSERT INTO daily_expenses (date_time, amount, expenses_by, reason)
        VALUES (NOW(), ?, ?, ?)
    `;

    db.query(insertSql, [amount, expenses_by, reason], (err, result) => {
        if (err) {
            console.error("Error inserting expense:", err);
            return res.status(500).json({
                status: 500,
                message: "Failed to create expense",
            });
        }

        return res.status(201).json({
            status: 201,
            message: "Expense created successfully",
            expense_id: result.insertId,
        });
    });
};

exports.getAllExpenses = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { fromDate, toDate } = req.query;

    let sql = `
        SELECT SQL_CALC_FOUND_ROWS 
               d.expenses_id,
               d.date_time,
               d.amount,
               d.reason,
               u.user_name AS expenses_by
        FROM daily_expenses d
        LEFT JOIN users u 
            ON d.expenses_by = u.user_id
        WHERE 1 = 1
    `;

    const params = [];

    // ✅ Date filters (optional)
    if (fromDate && toDate) {
        sql += ` AND DATE(d.date_time) BETWEEN ? AND ?`;
        params.push(fromDate, toDate);
    } else if (fromDate) {
        sql += ` AND DATE(d.date_time) >= ?`;
        params.push(fromDate);
    } else if (toDate) {
        sql += ` AND DATE(d.date_time) <= ?`;
        params.push(toDate);
    }

    // order + pagination
    sql += ` ORDER BY d.date_time DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Fetch expenses failed:", err);
            return res.status(500).json({ message: "Failed to fetch expenses" });
        }

        // get total for pagination
        db.query("SELECT FOUND_ROWS() AS total", (err2, totalResult) => {
            if (err2) {
                return res.status(500).json({ message: "Failed to fetch total count" });
            }

            const total = totalResult[0].total;
            const totalPages = Math.ceil(total / limit);

            res.status(200).json({
                page,
                limit,
                total,
                totalPages,
                expenses: results
            });
        });
    });
};

