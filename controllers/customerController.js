const db = require('../db');

// ✅ Create Customer
exports.createCustomer = (req, res) => {
    const {name, email, mobile, lan_number, age, nic, address} = req.body;

    //  Define fields and validation rules
    const validations = [
        {
            key: 'name',
            field: name,
            label: 'Customer name',
            validate: (val) => !!val,
            error: 'Customer name is required'
        },
        {
            key: 'address',
            field: address,
            label: 'Customer address',
            validate: (val) => !!val,
            error: 'Customer address is required'
        },
        {
            key: 'age',
            field: age,
            label: 'Customer age',
            validate: (val) => val !== undefined && val !== null && val !== '' && !isNaN(val) && Number(val) > 0 && Number.isInteger(Number(val)),
            error: 'Customer age must be a valid positive number'
        }];

    //  Collect failed validations
    const errors = validations
        .filter((v) => !v.validate(v.field))
        .map((v) => ({ [v.key]: v.error }));

    //  If any field failed validation, return all errors
    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed', errors
        });
    }


    const sql = `
    INSERT INTO customers (name, email, mobile, lan_number, age, nic, address, create_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

    db.query(sql, [name, email, mobile, lan_number, age, nic, address], (err, result) => {
        if (err) {
            console.error('Customer insert failed:', err);
            return res.status(500).json({message: 'Customer insert failed'});
        }

        res.status(201).json({
            message: 'Customer added successfully', customerId: result.insertId
        });
    });
};

// ✅ Update Customer
exports.updateCustomer = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // If no fields provided
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: 'No fields provided for update'
        });
    }

    // Build SQL dynamically
    const fields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
    const values = Object.values(updates);

    const sql = `UPDATE customers SET ${fields} WHERE cus_id = ?`;

    db.query(sql, [...values, id], (err, result) => {
        if (err) {
            console.error('Customer update failed:', err);
            return res.status(500).json({ message: 'Customer update failed' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json({
            message: 'Customer updated successfully'
        });
    });
};

// ✅ Soft Delete Customer
exports.deleteCustomer = (req, res) => {
    const { id } = req.params;

    const sql = `
    UPDATE customers
    SET status = 0, deleted_date = NOW()
    WHERE cus_id = ?
  `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Customer delete failed:', err);
            return res.status(500).json({ message: 'Customer delete failed' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.status(200).json({
            message: 'Customer deleted successfully'
        });
    });
};

// ✅ Get all customers (with pagination)
exports.getCustomers = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { fromDate, toDate } = req.query;

    // ✅ Base query
    let sql = `
    SELECT SQL_CALC_FOUND_ROWS *
    FROM customers
    WHERE status = 1
  `;
    const params = [];

    // ✅ Apply date filter if provided
    if (fromDate && toDate) {
        sql += ` AND DATE(create_date) BETWEEN ? AND ?`;
        params.push(fromDate, toDate);
    } else if (fromDate) {
        sql += ` AND DATE(create_date) >= ?`;
        params.push(fromDate);
    } else if (toDate) {
        sql += ` AND DATE(create_date) <= ?`;
        params.push(toDate);
    }

    sql += ` ORDER BY create_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Fetch customers failed:', err);
            return res.status(500).json({ message: 'Failed to fetch customers' });
        }

        db.query('SELECT FOUND_ROWS() as total', (err2, totalResult) => {
            if (err2) {
                return res.status(500).json({ message: 'Failed to fetch total count' });
            }

            const total = totalResult[0].total;
            const totalPages = Math.ceil(total / limit);

            res.status(200).json({
                page,
                limit,
                total,
                totalPages,
                customers: results
            });
        });
    });
};

// customer search
exports.customerSearch = (req, res) => {
    const q = req.query.q;

    if (!q || q.trim().length < 2) {
        return res.json({ data: [] });
    }

    const sql = `
        SELECT cus_id, MIN(text) AS text
        FROM (
            SELECT cus_id, name AS text, 1 AS priority
            FROM customers 
            WHERE name LIKE CONCAT('%', ?, '%')

            UNION ALL

            SELECT cus_id, mobile AS text, 2 AS priority
            FROM customers 
            WHERE mobile LIKE CONCAT('%', ?, '%')

            UNION ALL

            SELECT cus_id, nic AS text, 3 AS priority
            FROM customers 
            WHERE nic LIKE CONCAT('%', ?, '%')

            UNION ALL

            SELECT cus_id, address AS text, 4 AS priority
            FROM customers 
            WHERE address LIKE CONCAT('%', ?, '%')
        ) AS matches
        GROUP BY cus_id
        ORDER BY MIN(priority)
        LIMIT 10
    `;

    db.query(sql, [q, q, q, q], (err, results) => {
        if (err) {
            console.error("Customer search error:", err);
            return res.status(500).json({ error: "Server Error" });
        }

        res.status(200).json(results);
    });
};

// get customer by Id
exports.getCustomerById = (req, res) => {
    const { id } = req.params;

    // console.log("frame id :",id)
    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }
    const sql = `SELECT * FROM customers WHERE cus_id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Fetch by ID failed:", err);
            return res.status(500).json({ message: "Fetch by ID failed" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "customer not found" });
        }

        res.status(200).json(result[0]);
    });
};
