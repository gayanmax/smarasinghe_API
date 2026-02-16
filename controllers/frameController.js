const db = require('../db');


// exports.getFrameCategory = (req, res) => {
//
//     const table_name = req.query.name;
//
//     const allowedTables = ['frame_brand', 'frame_bridgewidth', 'frame_color', 'frame_lenswidth', 'frame_model','frame_templelength'];
//
//     if (!allowedTables.includes(table_name)) {
//         return res.status(400).json({message: 'Invalid table name'});
//     }
//
//     const sql = `SELECT * FROM ${table_name} WHERE status = 1`;
//
//     db.query(sql, (err, rows) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).json({message: 'Database error'});
//         }
//
//         res.status(200).json(rows);
//     });
// };

//get all frame parts from each table
exports.getAllFrameDetails = (req, res) => {

    const queries = {
        brand: 'SELECT id, name FROM frame_brand WHERE status = 1',
        bridgeWidth: 'SELECT id, name FROM frame_bridgewidth WHERE status = 1',
        color: 'SELECT id, name FROM frame_color WHERE status = 1',
        lensWidth: 'SELECT id, name FROM frame_lenswidth WHERE status = 1',
        templeLength: 'SELECT id, name FROM frame_templelength WHERE status = 1',
        // model: `SELECT id,model_code,frame_brand_id FROM frame_model WHERE status = 1`,
        // ✅ NEW: frame model with brand name
        model: `
            SELECT
                fm.id,
                fm.model_code,
                fm.frame_brand_id,
                fb.name AS brand
            FROM frame_model fm
            JOIN frame_brand fb ON fm.frame_brand_id = fb.id
            WHERE fm.status = 1
        `
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

//get all frames from frame table
exports.getAllFrameKeys = (req, res) => {

    const dataSql = `
        SELECT
            f.id,
            f.frame_id,

            fb.name  AS frame_brand,
            fm.model_code  AS frame_model,
            fl.name  AS frame_lenswidth,
            fbw.name AS frame_bridgewidth,
            ft.name  AS frame_templelength,
            fc.name  AS frame_color,

            f.frame_quantity,
            f.frame_selling_price,
            f.frame_discount_price,
            f.status
        FROM frame f
        LEFT JOIN frame_brand fb ON f.frame_brand = fb.id
        LEFT JOIN frame_model fm ON f.frame_model = fm.id
        LEFT JOIN frame_lenswidth fl ON f.frame_Lenswidth = fl.id
        LEFT JOIN frame_bridgewidth fbw ON f.frame_bridgewidth = fbw.id
        LEFT JOIN frame_templelength ft ON f.frame_templelength = ft.id
        LEFT JOIN frame_color fc ON f.frame_color = fc.id;
    `;

    const countSql = `SELECT COUNT(*) AS frame_count FROM frame`;

    db.query(dataSql, (err, rows) => {
        if (err) {
            console.error("Fetching frame keys failed:", err);
            return res.status(500).json({ message: "Fetching frame keys failed" });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Frames not found" });
        }

        db.query(countSql, (countErr, countResult) => {
            if (countErr) {
                console.error("Fetching frame count failed:", countErr);
                return res.status(500).json({ message: "Fetching frame count failed" });
            }

            return res.status(200).json({
                frame_count: countResult[0].frame_count,
                data: rows
            });
        });
    });
};

// get one frame using id
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

// exports.updateFrameStatus = (req, res) => {
//     const { id } = req.params;
//     const { status } = req.body;
//
//     // Basic validation
//     if (id === undefined || status === undefined) {
//         return res.status(400).json({ message: "Frame id and status are required" });
//     }
//
//     // Enforce allowed values
//     if (![0, 1].includes(Number(status))) {
//         return res.status(400).json({ message: "Status must be 0 or 1" });
//     }
//
//     const sql = `UPDATE frame SET status = ? WHERE id = ?`;
//
//     db.query(sql, [status, id], (err, result) => {
//         if (err) {
//             console.error("Updating frame status failed:", err);
//             return res.status(500).json({ message: "Updating frame status failed" });
//         }
//
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: "Frame not found" });
//         }
//
//         return res.status(200).json({
//             message: "Frame status updated successfully",
//             id,
//             status
//         });
//     });
// };

// update each frame part table status
exports.updateStatus = (req, res) => {
    const {table_name, id} = req.body;

    // ✅ Whitelist tables to prevent SQL injection
    const allowedTables = ['frame_brand', 'frame_bridgewidth', 'frame_color', 'frame_lenswidth','frame_templelength', 'frame_model'];
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

// select frames in frame table using brand id for job modal
exports.getFrameByBrand = (req, res) => {

    const { brand } = req.body;

    if (!brand) {
        return res.status(400).json({ message: 'Frame brand is required' });
    }

    const sql = `
        SELECT id, frame_id, frame_selling_price
        FROM frame
        WHERE frame_brand = ? AND status = 1
    `;

    db.query(sql, [brand], (err, rows) => {
        if (err) {
            console.error('DB Error:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        res.status(200).json({
            brand: brand,
            data: rows
        });
    });
};


// ==========================
// 🔹 Insert New Record
// ==========================
// create new part for frame parts tables except frame_model
exports.insertData = (req, res) => {
    const {table_name, name} = req.body;

    const allowedTables = ['frame_brand', 'frame_bridgewidth', 'frame_color', 'frame_lenswidth','frame_templelength'];
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

// create frame in frame table
exports.createFrame = (req, res) => {
    const { formData } = req.body;

    if (!formData) {
        return res.status(400).json({
            message: "Invalid request payload"
        });
    }

    const {
        frameKey,
        brand,
        model,
        lensWidth,
        bridgeWidth,
        templeLength,
        color,
        sellingPrice,
        discountPrice,
        quantity
    } = formData;

    // basic safety check
    if (
        !frameKey ||
        !brand ||
        !model ||
        !lensWidth ||
        !bridgeWidth ||
        !templeLength ||
        !color ||
        sellingPrice === undefined ||
        discountPrice === undefined ||
        quantity === undefined
    ) {
        return res.status(400).json({
            message: "Missing required fields"
        });
    }

    // ✅ status logic
    const status = quantity > 0 ? 1 : 0;

    const sql = `
        INSERT INTO frame (
            frame_id,
            frame_brand,
            frame_model,
            frame_Lenswidth,
            frame_bridgewidth,
            frame_templelength,
            frame_color,
            frame_selling_price,
            frame_discount_price,
            frame_quantity,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        frameKey,
        brand,
        model,
        lensWidth,
        bridgeWidth,
        templeLength,
        color,
        sellingPrice,
        discountPrice,
        quantity,
        status
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Create frame error:", err);

            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "Frame key already exists"
                });
            }

            return res.status(500).json({
                message: "Failed to create frame"
            });
        }

        return res.status(200).json({
            message: "Frame created successfully",
            frame_id: result.insertId
        });
    });
};


// exports.getActiveFrames = (req, res) => {
//     const sql = `SELECT id,frame_id FROM frame WHERE status = 1`;
//
//     db.query(sql, (err, result) => {
//         if (err) {
//             console.error("Error fetching frame IDs:", err);
//             return res.status(500).json({ message: "Database error", error: err });
//         }
//
//         res.status(200).json(result);
//         // return res.status(200).json({
//         //     success: true,
//         //     frame_ids: result.map(row => row.frame_id)
//         // });
//     });
// };

// frame_id verification before create
exports.verifyFrameKey = (req, res) => {
    const { frame_key } = req.body;

    if (!frame_key) {
        return res.status(400).json({
            valid: false,
            message: "Frame key is required"
        });
    }

    const sql = `
        SELECT frame_id 
        FROM frame 
        WHERE frame_id = ?
        LIMIT 1
    `;

    db.query(sql, [frame_key], (err, results) => {
        if (err) {
            console.error("Frame key verification error:", err);
            return res.status(500).json({
                valid: false,
                message: "Database error"
            });
        }

        if (results.length > 0) {
            // Frame key already exists
            return res.status(409).json({
                valid: false,
                message: "Frame key already exists"
            });
        }

        // Frame key is unique
        return res.status(200).json({
            valid: true,
            message: "Frame key is available"
        });
    });
};

// change frame status switch API
exports.updateFrameStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
        return res.status(400).json({
            success: false,
            message: "Status is required",
        });
    }

    const sql = "UPDATE frame SET status = ? WHERE id = ?";

    db.query(sql, [status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false });
        }

        res.json({ success: true });
    });
};

// permanently remove a frame
exports.deleteFrameById = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "Frame id is required"
        });
    }

    const sql = "DELETE FROM frame WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Delete frame error:", err);
            return res.status(500).json({
                message: "Failed to delete frame"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Frame not found"
            });
        }

        return res.status(200).json({
            message: "Frame deleted successfully",
            deletedId: id
        });
    });
};

// update only frame prices and quantity with status
exports.updateFrameDetails = (req, res) => {
    const {
        id,
        frame_selling_price,
        frame_discount_price,
        frame_quantity
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: "Frame ID is required" });
    }

    const checkSql = `
        SELECT frame_quantity, status
        FROM frame
        WHERE id = ?
    `;

    db.query(checkSql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Frame not found" });
        }

        const existingQuantity = Number(result[0].frame_quantity);
        let newStatus = result[0].status;
        const updatedQuantity = Number(frame_quantity);

        // Enable when quantity recovers
        if (existingQuantity === 0 && updatedQuantity > 0) {
            newStatus = 1;
        }

        // Disable when quantity hits zero
        if (existingQuantity > 0 && updatedQuantity === 0) {
            newStatus = 0;
        }

        const updateSql = `
            UPDATE frame
            SET
                frame_selling_price = ?,
                frame_discount_price = ?,
                frame_quantity = ?,
                status = ?
            WHERE id = ?
        `;

        db.query(
            updateSql,
            [
                frame_selling_price,
                frame_discount_price,
                frame_quantity,
                newStatus,
                id
            ],
            (err, updateResult) => {
                if (err) {
                    return res.status(500).json({ message: "Update failed", error: err });
                }

                return res.json({
                    message: "Frame updated successfully",
                    affectedRows: updateResult.affectedRows
                });
            }
        );
    });
};

// create frame models
exports.createFrameModel = (req, res) => {
    const { name, brand_id } = req.body;

    // Basic validation
    if (!name || !brand_id) {
        return res.status(400).json({
            success: false,
            message: 'Model name and brand_id are required'
        });
    }

    const sql = `
        INSERT INTO frame_model 
        (model_code, frame_brand_id, status)
        VALUES (?, ?, 1)
    `;

    db.query(sql, [name, brand_id], (err, result) => {
        if (err) {
            console.error('Create frame model error:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to create frame model'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Frame model created successfully',
            data: {
                id: result.insertId,
                model_code: name,
                frame_brand_id: brand_id,
                status: 1
            }
        });
    });
};