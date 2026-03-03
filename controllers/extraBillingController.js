const db = require("../db");

exports.addExtraBilling = (req, res) => {
    const {
        name,
        contact,
        address,
        items,
        total_amount,
        payment_method
    } = req.body;

    const userId = req.user?.user_id || null;

    // ==========================
    // BASIC VALIDATION
    // ==========================
    if (
        !items ||
        !Array.isArray(items) ||
        items.length === 0 ||
        total_amount == null ||
        !payment_method
    ) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    // ==========================
    // STEP 1: INSERT INTO BILLING
    // ==========================
    const billSql = `
        INSERT INTO billing 
        (job_id, amount, payment_method, bill_type, bill_date, payment_status, is_claimer_bill, billed_by)
        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
    `;

    const billValues = [
        0,                      // job_id
        total_amount,           // FULL GRAND TOTAL
        payment_method,
        "Extra Payment",
        1,                      // payment_status
        0,                      // is_claimer_bill
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

        // ==========================
        // STEP 2: INSERT MULTIPLE ITEMS INTO extra_billing
        // ==========================

        const extraSql = `
            INSERT INTO extra_billing
            (bill_id, name, contact, address, item_name, amount, quantity, total, payment_by)
            VALUES ?
        `;

        // Build bulk insert array
        const extraValues = items.map(item => [
            bill_id,
            name,
            contact,
            address,
            item.item_name,
            item.amount,
            item.quantity || 1,
            item.row_total,     // each row total
            userId
        ]);

        db.query(extraSql, [extraValues], (extraErr, extraResult) => {
            if (extraErr) {
                console.error("Extra billing insert error:", extraErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to add extra billing items"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Extra billing added successfully",
                bill_id: bill_id,
                items_inserted: extraResult.affectedRows
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
    const billId = req.params.id;

    if (!billId) {
        return res.status(400).json({
            success: false,
            message: "Bill ID is required"
        });
    }

    // ==========================
    // STEP 1: Get bill data from billing table
    // ==========================
    const billSql = `
        SELECT 
            bill_id,
            amount,
            payment_method,
            bill_type,
            bill_date
        FROM billing
        WHERE bill_id = ? 
        LIMIT 1
    `;

    db.query(billSql, [billId], (billErr, billResults) => {
        if (billErr) {
            console.error("DB Error (getExtraBillingById - billing):", billErr);
            return res.status(500).json({
                success: false,
                message: "Database error fetching bill"
            });
        }

        if (!billResults || billResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Billing record not found"
            });
        }

        const billData = billResults[0];

        // ==========================
        // STEP 2: Get all items for this bill from extra_billing
        // ==========================
        const itemsSql = `
            SELECT 
                id,
                item_name,
                amount,
                quantity,
                total,
                name,
                contact,
                address
            FROM extra_billing
            WHERE bill_id = ? 
        `;

        db.query(itemsSql, [billId], (itemsErr, itemsResults) => {
            if (itemsErr) {
                console.error("DB Error (getExtraBillingById - items):", itemsErr);
                return res.status(500).json({
                    success: false,
                    message: "Database error fetching items"
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    bill: billData,
                    items: itemsResults || []
                }
            });
        });
    });
};
