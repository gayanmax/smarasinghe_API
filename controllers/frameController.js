const db = require('../db');

exports.getFrameCategory = (req, res) => {

    const  table_name  = req.query.name;

    const allowedTables = ['frame_brand', 'frame_category','frame_color', 'frame_size','frame_type'];

    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({  message: 'Invalid table name' });
    }

    const sql = `SELECT id, name FROM ${table_name} WHERE status = 1`;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({  message: 'Database error' });
        }

        res.status(200).json({  data: rows });
    });
};


exports.updateStatus = (req, res) => {
    const { table_name, id } = req.body; // table name + row id from request body

    // ✅ Whitelist tables to prevent SQL injection
    const allowedTables = ['frame_brand', 'frame_category','frame_color', 'frame_size','frame_type'];
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

// ==========================
// 🔹 Insert New Record
// ==========================
exports.insertData = (req, res) => {
    const { table_name, name } = req.body;

    const allowedTables = ['frame_brand', 'frame_category','frame_color', 'frame_size','frame_type'];
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