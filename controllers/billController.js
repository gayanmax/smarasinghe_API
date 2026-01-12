const db = require('../db');

// recalculatePaymentsRandom50 function
function recalculatePaymentsRandom50(payments, newTotal) {
    const oldTotal = payments.reduce((s, p) => s + p.amount, 0);
    const factor = newTotal / oldTotal;

    let recalculated = payments.map(p => ({
        ...p, // ✅ keep bill_id, date, method, billed_by
        oldAmount: p.amount,
        newAmount: Math.floor((p.amount * factor) / 50) * 50
    }));

    let currentTotal = recalculated.reduce((s, p) => s + p.newAmount, 0);
    let remainder = newTotal - currentTotal;

    while (remainder >= 50) {
        const i = Math.floor(Math.random() * recalculated.length);
        recalculated[i].newAmount += 50;
        remainder -= 50;
    }

    return {
        oldTotal,
        newTotal,
        newPayments: recalculated
    };
}

// Helper: insert into billing_deduction table
function insertBillingDeductions(job_id, recalculatedPayments, db, callback) {
    const sql = `
        INSERT INTO billing_deduction
        (bill_id, job_id, amount, payment_method, bill_type, bill_date, payment_status, is_claimer_bill, billed_by)
        VALUES ?`;

    const values = recalculatedPayments.newPayments.map(p => ([
        p.bill_id,
        job_id,
        p.newAmount,
        p.payment_method,
        p.bill_type,
        p.bill_date,
        1,
        0,
        p.billed_by
    ]));

    console.log("Billing deduction values:", values);
    db.query(sql, [values], callback);
}

// ===============================
// Main createBilling controller
// ===============================
exports.createBilling = (req, res) => {
    const { job_id, amount, payment_method, bill_type, newTotal } = req.body;
    const billed_by = req.user?.user_id;

    if (!job_id || !amount || isNaN(amount) || amount <= 0 || !bill_type || !billed_by) {
        return res.status(400).json({ message: "Invalid input data" });
    }

    // 1️⃣ Get job details
    const jobSql = `SELECT due_amount,frame_deduction,netPrice, is_claimer FROM job WHERE job_id = ?`;
    db.query(jobSql, [job_id], (err, jobResult) => {
        if (err) return res.status(500).json({ message: "Job lookup failed" });
        if (jobResult.length === 0) return res.status(404).json({ message: "Job not found" });

        const dueAmount = Number(jobResult[0].due_amount);
        const is_claimer = Number(jobResult[0].is_claimer);
        const deduction_amount = Number(jobResult[0].netPrice) -  Number(jobResult[0].frame_deduction);

        if (amount > dueAmount) {
            return res.status(400).json({ message: "Payment exceeds due amount", dueAmount });
        }

        // =======================
        // 🟢 is_claimer == 0
        // =======================
        if (is_claimer === 0) {
            const newDue = dueAmount - amount;

            const billingSql = `
                INSERT INTO billing
                (job_id, amount, payment_method, bill_type, bill_date, payment_status, billed_by)
                VALUES (?, ?, ?, ?, NOW(), 1, ?)
            `;

            db.query(billingSql, [job_id, amount, payment_method, bill_type, billed_by], (err2, result) => {
                if (err2) return res.status(500).json({ message: "Billing insert failed" });

                db.query(`UPDATE job SET due_amount = ? WHERE job_id = ?`, [newDue, job_id]);

                // 🟢 Not final bill
                if (newDue > 0) {
                    return res.status(201).json({
                        message: "Billing added",
                        billId: result.insertId,
                        dueAmount: newDue
                    });
                }

                // 🔴 Final bill → recalc & insert into billing_deduction
                const fetchBillsSql = `
                        SELECT bill_id, bill_type, amount, payment_method, bill_date
                        FROM billing
                        WHERE job_id = ?
                        ORDER BY bill_date ASC`;

                db.query(fetchBillsSql, [job_id], (err3, bills) => {
                    if (err3) return res.status(500).json({ message: "Failed to fetch billing" });

                    // convert to payments format
                    const payments = bills.map(b => ({
                        bill_id: b.bill_id,
                        bill_type: b.bill_type,
                        amount: Number(b.amount),
                        payment_method: b.payment_method,
                        bill_date: b.bill_date,
                        billed_by  }));


                    // recalc using random 50
                    const recalculated = recalculatePaymentsRandom50(payments, deduction_amount);

                    // insert to billing_deduction
                    insertBillingDeductions(job_id, recalculated, db, (err4) => {

                        if (err4) return res.status(500).json({ message: "Failed to insert billing deductions" });

                        return res.status(201).json({
                            message: "Final bill paid and deductions saved",
                            deduction_amount: deduction_amount,
                            finalBillId: result.insertId,
                            recalculated,
                            dueAmount: 0
                        });
                    });
                });
            });
        }

            // =======================
            // 🟠 is_claimer == 1
        // =======================
        else {
            const newDue = dueAmount - amount;

            const tempBillingSql = `
                INSERT INTO temp_billing
                (job_id, amount, payment_method, bill_type, bill_date, payment_status, billed_by)
                VALUES (?, ?, ?, ?, NOW(), 1, ?)
            `;

            db.query(tempBillingSql, [job_id, amount, payment_method, bill_type, billed_by], (err2, result) => {
                if (err2) return res.status(500).json({ message: "Temp billing insert failed" });

                db.query(`UPDATE job SET due_amount = ? WHERE job_id = ?`, [newDue, job_id]);

                return res.status(201).json({
                    message: "Billing added to temp_billing",
                    tempBillId: result.insertId,
                    dueAmount: newDue
                });
            });
        }
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
