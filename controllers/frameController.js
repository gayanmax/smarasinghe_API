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

exports.getAllFrameDetails = (req, res) => {

    const queries = {
        brand: 'SELECT id, name FROM frame_brand WHERE status = 1',
        category: 'SELECT id, name FROM frame_category WHERE status = 1',
        color: 'SELECT id, name FROM frame_color WHERE status = 1',
        size: 'SELECT id, name FROM frame_size WHERE status = 1',
        type: 'SELECT id, name FROM frame_type WHERE status = 1'
    };

    const result = {};

    const keys = Object.keys(queries);
    let completed = 0;

    keys.forEach(key => {
        db.query(queries[key], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database error' });
            }

            result[key] = rows;
            completed++;

            if (completed === keys.length) {
                res.status(200).json(result);
            }
        });
    });
};

exports.getAllFrameKeys = (req, res) => {
    const sql = `SELECT id, frame_id, status FROM frame`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Fetching frame keys failed:", err);
            return res.status(500).json({ message: "Fetching frame keys failed" });
        }

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Frames not found" });
        }

        return res.status(200).json(result);
    });
};

exports.getFrameById = (req, res) => {
    const { id } = req.params;

    // console.log("frame id :",id)
    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    const sql = `SELECT frame_id FROM frame WHERE id = ?`;

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

exports.updateFrameStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Basic validation
    if (id === undefined || status === undefined) {
        return res.status(400).json({ message: "Frame id and status are required" });
    }

    // Enforce allowed values
    if (![0, 1].includes(Number(status))) {
        return res.status(400).json({ message: "Status must be 0 or 1" });
    }

    const sql = `UPDATE frame SET status = ? WHERE id = ?`;

    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error("Updating frame status failed:", err);
            return res.status(500).json({ message: "Updating frame status failed" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Frame not found" });
        }

        return res.status(200).json({
            message: "Frame status updated successfully",
            id,
            status
        });
    });
};

exports.updateStatus = (req, res) => {
    const {table_name, id} = req.body;

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
