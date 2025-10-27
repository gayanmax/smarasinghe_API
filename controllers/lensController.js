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

exports.insertData = (req, res) => {
    const { table_name, name } = req.body;

    const allowedTables = ['lense_category', 'lense_type', 'lense_color', 'lense_size'];
    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({ success: false, message: 'Invalid table name' });
    }

    if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const sql = `INSERT INTO ${table_name} (name, status) VALUES (?, 1)`;

    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({
            success: true,
            message: 'Data inserted successfully',
            id: result.insertId
        });
    });
};

//lens ordered company APIs

exports.getAllLensOrders = (req, res) => {
    const sql = `SELECT id, order_company_name FROM lens_orded WHERE is_active = 1`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching companies:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        res.status(200).json({
            success: true,
            data: result
        });
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

