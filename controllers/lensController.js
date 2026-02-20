const db = require('../db');


exports.getLensCategory = (req, res) => {

    const  table_name  = req.query.name;

    const allowedTables = ['lense_category', 'lense_type', 'lense_color','lense_size'];

    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({  message: 'Invalid table name' });
    }

    const sql = `SELECT id, name FROM ${table_name} WHERE status = 1`;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({  message: 'Database error' });
        }

        // res.status(200).json({  data: rows });
        res.status(200).json(rows);
    });
};

exports.updateStatus = (req, res) => {
    const { table_name, id } = req.body; // table name + row id from request body

    // ✅ Whitelist tables to prevent SQL injection
    const allowedTables = ['lense_category', 'lense_type', 'lense_color', 'lense_size'];
    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({ success: false, message: 'Invalid table name' });
    }

    const sql = `UPDATE ${table_name} SET status = 0 WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, message: 'Status updated to 0' });
    });
};

// exports.insertData = (req, res) => {
//     const { table_name, name } = req.body;
//
//     const allowedTables = ['lense_category', 'lense_type', 'lense_color', 'lense_size'];
//     if (!allowedTables.includes(table_name)) {
//         return res.status(400).json({ success: false, message: 'Invalid table name' });
//     }
//
//     if (!name || name.trim() === '') {
//         return res.status(400).json({ success: false, message: 'Name is required' });
//     }
//
//     const sql = `INSERT INTO ${table_name} (name, status) VALUES (?, 1)`;
//
//     db.query(sql, [name], (err, result) => {
//         if (err) {
//             console.error('Insert error:', err);
//             return res.status(500).json({ success: false, message: 'Database error' });
//         }
//
//         res.status(200).json({
//             success: true,
//             message: 'Data inserted successfully',
//             id: result.insertId
//         });
//     });
// };

exports.insertData = (req, res) => {
    const { table_name, name } = req.body;

    const allowedTables = [
        'lense_category', 'lense_type', 'lense_color', 'lense_size'
    ];

    // 1️⃣ Validate table name
    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid table name'
        });
    }

    // 2️⃣ Validate name
    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Name is required'
        });
    }

    const trimmedName = name.trim();

    // 3️⃣ Check if already exists (case-insensitive)
    const checkSql = `
        SELECT id FROM ${table_name}
        WHERE LOWER(name) = LOWER(?)
        LIMIT 1
    `;

    db.query(checkSql, [trimmedName], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Check error:', checkErr);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        // If record exists → return already exists
        if (checkResult.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Item already exists'
            });
        }

        // 4️⃣ Insert if not exists
        const insertSql = `
            INSERT INTO ${table_name} (name, status)
            VALUES (?, 1)
        `;

        db.query(insertSql, [trimmedName], (insertErr, result) => {
            if (insertErr) {
                console.error('Insert error:', insertErr);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Data inserted successfully',
                id: result.insertId
            });
        });
    });
};

exports.getLensNames = async (req, res) => {
    try {
        const tables = [
            "lense_category",
            "lense_type",
            "lense_size",
            "lense_color"
        ];

        const results = {};

        for (const table of tables) {
            const [rows] = await db.promise().query(
                `SELECT * FROM ??`,
                [table]
            );

            results[table] = rows;
        }

        res.status(200).json(results);

    } catch (error) {
        console.error("Error fetching lens data:", error);
        res.status(500).json({ error: "Failed to fetch lens data" });
    }
};

//lens ordered company APIs

exports.getAllLensOrders = (req, res) => {
    const sql = `SELECT id, order_company_name, Telephone FROM lens_orded WHERE is_active = 1`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching companies:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        res.status(200).json(result);
        // res.status(200).json({
        //     success: true,
        //     data: result
        // });
    });
};

exports.getOrderById = (req, res) => {
    const { id } = req.params;

    // console.log("supplier id :",id)

    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    const sql = `SELECT order_company_name, Telephone FROM lens_orded WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Fetch by ID failed:", err);
            return res.status(500).json({ message: "Fetch by ID failed" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Frame not found" });
        }

        res.status(200).json(result[0]);
    });
};

exports.createLensOrder = (req, res) => {
    const { order_company_name, Address, Telephone } = req.body;

    if (!order_company_name) {
        return res.status(400).json({ message: "Company name is required" });
    }

    const sql = `INSERT INTO lens_orded (order_company_name, Address, Telephone) VALUES (?, ?, ?)`;

    db.query(sql, [order_company_name, Address || '', Telephone || ''], (err, result) => {
        if (err) {
            console.error("Error inserting company:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        res.status(201).json({
            success: true,
            message: "Company added successfully",
            id: result.insertId
        });
    });
};

exports.deleteLensOrder = (req, res) => {
    const { id } = req.params;

    const sql = `UPDATE lens_orded SET is_active = 0 WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting company:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Company not found" });
        }

        res.status(200).json({
            success: true,
            message: "Company deleted successfully"
        });
    });
};

exports.deleteLensPart = (req, res) => {
    const { table_name, id } = req.body;

    // ✅ Whitelist tables to prevent SQL injection
    const allowedTables = [
        'lense_category',
        'lense_type',
        'lense_size',
        'lense_color'
    ];

    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid table name'
        });
    }

    const sql = `DELETE FROM ${table_name} WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        // Optional: check if row actually existed
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Record deleted permanently'
        });
    });
};
