const db = require('../db');

/** ✅ Create new prescribedby record */
exports.createPrescribedBy = (req, res) => {
    const { prescribed_By_name, status } = req.body;

    if (!prescribed_By_name || status === undefined) {
        return res.status(400).json({ message: "prescribed_By_name and status are required" });
    }

    const sql = `
        INSERT INTO prescribedby (prescribed_By_name, status)
        VALUES (?, ?)
    `;

    db.query(sql, [prescribed_By_name, status], (err, result) => {
        if (err) {
            console.error("Insert failed:", err);
            return res.status(500).json({ message: "Insert failed" });
        }

        res.status(201).json({
            message: "Prescribed By added successfully",
            prescribed_By_Id: result.insertId
        });
    });
};

/** ✅ Get all prescribedby records */
exports.getAllPrescribedBy = (req, res) => {
    const sql = `
        SELECT 
            prescribed_By_Id,
            prescribed_By_name,
            status,
            create_date
        FROM prescribedby
        ORDER BY prescribed_By_Id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Fetch failed:", err);
            return res.status(500).json({ message: "Fetch failed" });
        }

        res.status(200).json(result);
    });
};

/** ✅ Get single prescribedby by ID */
exports.getPrescribedByById = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    const sql = `
        SELECT 
            prescribed_By_Id,
            prescribed_By_name,
            status,
            create_date
        FROM prescribedby
        WHERE prescribed_By_Id = ?
    `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Fetch by ID failed:", err);
            return res.status(500).json({ message: "Fetch by ID failed" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "PrescribedBy not found" });
        }

        res.status(200).json(result[0]);
    });
};

/** ✅ Delete prescribedby by ID */
exports.deletePrescribedBy = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    const sql = `DELETE FROM prescribedby WHERE prescribed_By_Id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Delete failed:", err);
            return res.status(500).json({ message: "Delete failed" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "PrescribedBy not found" });
        }

        res.status(200).json({ message: "PrescribedBy deleted successfully" });
    });
};
