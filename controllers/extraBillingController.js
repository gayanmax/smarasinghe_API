const db = require("../db");

exports.addExtraBilling = (req, res) => {
    const {
        name,
        contact,
        address,
        item_name,
        amount,
        description,
        payment_method
    } = req.body;

    const userId = req.user?.user_id || null;

    // basic validation
    if (!item_name || amount == null || !payment_method) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    /**
     * STEP 1: Create bill in billing table
     */
    const billSql = `
        INSERT INTO billing 
        (job_id, amount, payment_method, bill_type, bill_date, payment_status, is_claimer_bill, billed_by)
        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
    `;

    const billValues = [
        0,                    // job_id
        amount,
        payment_method,
        "Extra Payment",
        1,                    // payment_status
        0,                    // is_claimer_bill
        userId
    ];

    db.query(billSql, billValues, (billErr, billResult) => {
        if (billErr) {
            console.error("Billing insert error:", billErr);
            return res.status(500).json({
                success: false,
                message: "Failed to create bill"
            });
        }

        const bill_id = billResult.insertId;

        /**
         * STEP 2: Create extra billing linked to bill_id
         */
        const extraSql = `
            INSERT INTO extra_billing
            (bill_id, name, contact, address, item_name, amount, description, payment_method, payment_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const extraValues = [
            bill_id,
            name,
            contact,
            address,
            item_name,
            amount,
            description || null,
            payment_method,
            userId
        ];

        db.query(extraSql, extraValues, (extraErr, extraResult) => {
            if (extraErr) {
                console.error("Extra billing insert error:", extraErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to add extra billing"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Extra billing added successfully",
                bill_id,
                extra_billing_id: extraResult.insertId
            });
        });
    });
};

// ✅ Get all extra billing (with pagination)
exports.getAllExtraBilling = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { fromDate, toDate } = req.query;

    let whereSql = `WHERE status = 1`;
    const params = [];

    // ✅ Date filters
    if (fromDate && toDate) {
        whereSql += ` AND DATE(date) BETWEEN ? AND ?`;
        params.push(fromDate, toDate);
    } else if (fromDate) {
        whereSql += ` AND DATE(date) >= ?`;
        params.push(fromDate);
    } else if (toDate) {
        whereSql += ` AND DATE(date) <= ?`;
        params.push(toDate);
    }

    const dataSql = `
        SELECT *
        FROM extra_billing
        ${whereSql}
        ORDER BY date DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM extra_billing
        ${whereSql}
    `;

    // ✅ Get total count
    db.query(countSql, params, (countErr, countResult) => {
        if (countErr) {
            console.error("Extra billing count failed:", countErr);
            return res.status(500).json({
                message: "Failed to fetch total count"
            });
        }

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // ✅ Get paginated data
        db.query(
            dataSql,
            [...params, limit, offset],
            (dataErr, results) => {
                if (dataErr) {
                    console.error("Fetch extra billing failed:", dataErr);
                    return res.status(500).json({
                        message: "Failed to fetch extra billing"
                    });
                }

                res.status(200).json({
                    page,
                    limit,
                    total,
                    totalPages,
                    extra_billing: results
                });
            }
        );
    });
};

exports.removeExtraBilling = (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Extra billing id is required"
        });
    }

    const sql = `
        UPDATE extra_billing
        SET status = 0
        WHERE id = ? AND status = 1
    `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Record not found or already removed"
            });
        }

        return res.json({
            success: true,
            message: "Extra billing removed successfully"
        });
    });
};

exports.getExtraBillingById = (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Extra billing id is required"
        });
    }

    const sql = `
        SELECT 
            eb.id, 
            eb.bill_id, 
            eb.name,
            eb.contact,
            eb.address,
            eb.item_name, 
            eb.description, 
            eb.amount, 
            eb.payment_method,
            b.bill_type,
            b.bill_date,
            b.billed_by
        FROM extra_billing eb
        LEFT JOIN billing b ON eb.bill_id = b.bill_id
        WHERE eb.id = ? 
        AND eb.status = 1
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("DB Error (getExtraBillingById):", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Extra billing not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: results[0]
        });
    });
};