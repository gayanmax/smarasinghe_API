const db = require('../db');

// ✅ Insert Billing Record & Update Job due_amount
exports.createBilling = (req, res) => {
    const { job_id, amount,payment_method, bill_type } = req.body;
    const billed_by = req.user?.user_id;
    // ✅ Validation
    const errors = [];
    if (!job_id) errors.push({ job_id: "Job ID is required" });
    if (!amount || isNaN(amount)) errors.push({ amount: "Amount must be a valid number" });
    if (!bill_type) errors.push({ bill_type: "Bill type is required" });
    if (!billed_by) errors.push({ billed_by: "Billed by (user ID) is required" });

    if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
    }

    // ✅ Step 1: Check current due_amount
    const jobSql = `SELECT due_amount FROM job WHERE job_id = ?`;
    db.query(jobSql, [job_id], (err, jobResult) => {
        if (err) {
            console.error("Job lookup failed:", err);
            return res.status(500).json({ message: "Job lookup failed" });
        }
        if (jobResult.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const dueAmount = jobResult[0].due_amount;

        if (amount > dueAmount) {
            return res.status(400).json({
                message: "Billing failed: Payment exceeds due amount",
                dueAmount,
                attemptedAmount: amount
            });
        }

        // ✅ Step 2: Insert billing record
        const insertSql = `
      INSERT INTO billing (job_id, amount,payment_method, bill_type, bill_date,payment_status, billed_by)
      VALUES (?, ?,?, ?, NOW(),1, ?)
    `;

        db.query(insertSql, [job_id, amount,payment_method, bill_type, billed_by], (err2, result) => {
            if (err2) {
                console.error("Billing insert failed:", err2);
                return res.status(500).json({ message: "Billing insert failed" });
            }

            // ✅ Step 3: Update job due_amount
            const newDue = dueAmount - amount;
            const updateSql = `UPDATE job SET due_amount = ? WHERE job_id = ?`;

            db.query(updateSql, [newDue, job_id], (err3) => {
                if (err3) {
                    console.error("Job due_amount update failed:", err3);
                    return res.status(500).json({ message: "Job due_amount update failed" });
                }

                res.status(201).json({
                    message: "Billing record created successfully",
                    billId: result.insertId,
                    dueAmount: newDue
                });
            });
        });
    });
};



// ✅ Get Bill Details for a Job (with billing history)
exports.getBillDetails = (req, res) => {
    const { job_id } = req.params;

    // ✅ Step 1: Get job details
    const jobSql = `SELECT job_id, netPrice, due_amount FROM job WHERE job_id = ?`;
    db.query(jobSql, [job_id], (err, jobResult) => {
        if (err) {
            console.error("Job lookup failed:", err);
            return res.status(500).json({ message: "Job lookup failed" });
        }
        if (jobResult.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const job = jobResult[0];

        // ✅ Step 2: Get billing details
        const billingSql = `
      SELECT 
        bill_id,
        amount,
        bill_type,
        bill_date,
        billed_by
      FROM billing
      WHERE job_id = ?
      ORDER BY bill_date ASC
    `;

        db.query(billingSql, [job_id], (err2, billingRows) => {
            if (err2) {
                console.error("Billing lookup failed:", err2);
                return res.status(500).json({ message: "Billing lookup failed" });
            }

            // ✅ Total paid
            const totalPaid = billingRows.reduce((sum, row) => sum + row.amount, 0);

            // ✅ Prepare response
            res.status(200).json({
                job_id: job.job_id,
                total_price: job.netPrice,
                total_paid: totalPaid,
                due_amount: job.due_amount,
                billings: billingRows.map(b => ({
                    bill_id: b.bill_id,
                    amount: b.amount,
                    bill_type: b.bill_type,
                    bill_date: b.bill_date,
                    billed_by: b.billed_by
                }))
            });
        });
    });
};

//get all bill data
exports.getAllBillData = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { fromDate, toDate } = req.query;

    let sql = `
        SELECT SQL_CALC_FOUND_ROWS 
               billing.*,
               users.user_name AS billed_by
        FROM billing
        LEFT JOIN users ON users.user_id = billing.billed_by
        WHERE billing.payment_status = 1
          AND billing.bill_type != 'claim'
    `;
    const params = [];

    // ✅ Apply date filter if provided
    if (fromDate && toDate) {
        sql += ` AND DATE(bill_date) BETWEEN ? AND ?`;
        params.push(fromDate, toDate);
    } else if (fromDate) {
        sql += ` AND DATE(bill_date) >= ?`;
        params.push(fromDate);
    } else if (toDate) {
        sql += ` AND DATE(bill_date) <= ?`;
        params.push(toDate);
    }

    sql += ` ORDER BY bill_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Fetch billings failed:', err);
            return res.status(500).json({ message: 'Failed to fetch billings' });
        }

        db.query('SELECT FOUND_ROWS() as total', (err2, totalResult) => {
            if (err2) {
                return res.status(500).json({ message: 'Failed to fetch total count' });
            }

            const total = totalResult[0].total;
            const totalPages = Math.ceil(total / limit);

            res.status(200).json({
                page,
                limit,
                total,
                totalPages,
                billing: results
            });
        });
    });
};
