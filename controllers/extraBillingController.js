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
        0,
        total_amount,
        payment_method,
        "Extra Payment",
        1,
        0,
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
        // STEP 2: INSERT SINGLE ROW INTO extra_billing
        // ==========================
        // We now store the entire 'items' array as a JSON string
        const extraSql = `
            INSERT INTO extra_billing
            (bill_id, name, contact, address, items, total, payment_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const extraValues = [
            bill_id,
            name,
            contact,
            address,
            JSON.stringify(items), // Convert array to JSON string for the DB
            total_amount,
            userId
        ];

        db.query(extraSql, extraValues, (extraErr, extraResult) => {
            if (extraErr) {
                console.error("Extra billing insert error:", extraErr);
                return res.status(500).json({
                    success: false,
                    message: "Failed to add extra billing record"
                });
            }

            return res.status(201).json({
                success: true,
                message: "Extra billing added successfully",
                bill_id: bill_id,
                record_id: extraResult.insertId
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

    // Note: Ensure 'status' and 'date' columns exist in your extra_billing table
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

                // ==========================================
                // ✅ KEY MODIFICATION: PARSE THE JSON STRING
                // ==========================================
                const formattedResults = results.map(row => {
                    let parsedItems = [];
                    try {
                        // If it's already an object (driver-dependent), use it;
                        // otherwise, parse the string.
                        parsedItems = typeof row.items === 'string'
                            ? JSON.parse(row.items)
                            : row.items;
                    } catch (e) {
                        console.error("JSON parsing error for ID:", row.id, e);
                        parsedItems = []; // Fallback to empty array on error
                    }

                    return {
                        ...row,
                        items: parsedItems
                    };
                });

                res.status(200).json({
                    page,
                    limit,
                    total,
                    totalPages,
                    extra_billing: formattedResults
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

        // ==============================================
        // STEP 2: Get the single record from extra_billing
        // ==============================================
        const extraSql = `
            SELECT 
                id,
                items,    -- This is your new JSON column
                name,
                contact,
                address,
                total
            FROM extra_billing
            WHERE bill_id = ? 
            LIMIT 1
        `;

        db.query(extraSql, [billId], (extraErr, extraResults) => {
            if (extraErr) {
                console.error("DB Error (getExtraBillingById - extra):", extraErr);
                return res.status(500).json({
                    success: false,
                    message: "Database error fetching extra details"
                });
            }

            // Fallback if the extra_billing record doesn't exist for some reason
            const extraData = extraResults[0] || {};

            // ✅ Parse the items JSON string back into an array
            let parsedItems = [];
            try {
                if (extraData.items) {
                    parsedItems = typeof extraData.items === 'string'
                        ? JSON.parse(extraData.items)
                        : extraData.items;
                }
            } catch (e) {
                console.error("JSON parse error for items:", e);
                parsedItems = [];
            }

            return res.status(200).json({
                success: true,
                data: {
                    bill: billData,
                    customer: {
                        name: extraData.name,
                        contact: extraData.contact,
                        address: extraData.address,
                        total_from_extra: extraData.total
                    },
                    items: parsedItems // Frontend gets the same array format as before!
                }
            });
        });
    });
};
