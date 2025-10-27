const db = require('../db');

exports.getFrameCategory = (req, res) => {

    const table_name = req.query.name;

    const allowedTables = ['frame_brand', 'frame_category', 'frame_color', 'frame_size', 'frame_type'];

    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({message: 'Invalid table name'});
    }

    const sql = `SELECT id, name FROM ${table_name} WHERE status = 1`;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({message: 'Database error'});
        }

        res.status(200).json(rows);
    });
};

exports.updateStatus = (req, res) => {
    const {table_name, id} = req.body; // table name + row id from request body

    // ✅ Whitelist tables to prevent SQL injection
    const allowedTables = ['frame_brand', 'frame_category', 'frame_color', 'frame_size', 'frame_type'];
    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({success: false, message: 'Invalid table name'});
    }

    const sql = `UPDATE ${table_name} SET status = 0 WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({success: false, message: 'Database error'});
        }

        res.status(200).json({success: true, message: 'Status updated to 0'});
    });
};
// ==========================
// 🔹 Insert New Record
// ==========================
exports.insertData = (req, res) => {
    const {table_name, name} = req.body;

    const allowedTables = ['frame_brand', 'frame_category', 'frame_color', 'frame_size', 'frame_type'];
    if (!allowedTables.includes(table_name)) {
        return res.status(400).json({success: false, message: 'Invalid table name'});
    }

    if (!name || name.trim() === '') {
        return res.status(400).json({success: false, message: 'Name is required'});
    }

    const sql = `INSERT INTO ${table_name} (name, status) VALUES (?, 1)`;

    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({success: false, message: 'Database error'});
        }

        res.status(200).json({
            success: true,
            message: 'Data inserted successfully',
            id: result.insertId
        });
    });
};


exports.insertFrame = (req, res) => {
    const {
        frame_name,
        frame_type,
        frame_brand,
        frame_color,
        frame_size,
        status
    } = req.body;

    // Validate required fields
    if (!frame_name || !frame_type || !frame_brand || !frame_color || !frame_size) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Generate unique frame_id
    const combinedName = (
        frame_name + "/" + frame_type + "/" + frame_brand + "/" + frame_color + "/" + frame_size
    ).replace(/\s+/g, '').toLowerCase();

    const frameStatus = status !== undefined ? status : 1;

    // 🟡 Step 1: Check if frame_id already exists
    const checkSql = `SELECT frame_id FROM frame WHERE frame_id = ?`;

    db.query(checkSql, [combinedName], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking duplicate frame_id:", checkErr);
            return res.status(500).json({ message: "Database error during duplicate check", error: checkErr });
        }

        if (checkResult.length > 0) {
            // Duplicate found
            return res.status(409).json({
                success: false,
                message: "Frame already exists with the same combination"
            });
        }

        // 🟢 Step 2: Insert new frame
        const insertSql = `
            INSERT INTO frame
            (frame_id, frame_name, frame_type, frame_brand, frame_color, frame_size, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [combinedName, frame_name, frame_type, frame_brand, frame_color, frame_size, frameStatus], (insertErr, result) => {
            if (insertErr) {
                console.error("Error inserting frame:", insertErr);
                return res.status(500).json({ message: "Database error", error: insertErr });
            }

            return res.status(201).json({
                success: true,
                message: "Frame inserted successfully",
                frame_id: combinedName
            });
        });
    });
};


exports.getActiveFrames = (req, res) => {
    const sql = `SELECT id,frame_id FROM frame WHERE status = 1`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching frame IDs:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        res.status(200).json(result);
        // return res.status(200).json({
        //     success: true,
        //     frame_ids: result.map(row => row.frame_id)
        // });
    });
};
