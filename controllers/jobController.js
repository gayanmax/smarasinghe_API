const db = require('../db');

// ✅ Create Job
// exports.createJob = (req, res) => {
//     const {
//         cus_id,
//         job_status,
//         r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
//         l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
//         pupil_distance, seg_h,
//         prescribed_By_Id, comment, due_date,
//         order_status, lens_id, lens_status,
//         frame_id, frame_status,
//         frame_price,
//         lens_name,lens_type,lens_color,lens_size,ordered_by,ordered_date, lense_price, price, discount, netPrice,due_amount
//     } = req.body;
//
//     const created_by = req.user?.user_id; // ✅ logged-in user from JWT
//
//
//
//     const sql = `
//     INSERT INTO job (
//       cus_id, job_status,
//       r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
//       l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
//       pupil_distance, seg_h,
//       prescribed_By_Id, comment, due_date,
//       order_status, lens_id, lens_status,
//       frame_id, frame_status,
//       frame_price, lense_price, price, discount, netPrice,due_amount,
//       create_date
//     ) VALUES (
//       ?, ?,
//       ?, ?, ?, ?, ?, ?,
//       ?, ?, ?, ?, ?, ?,
//       ?, ?,
//       ?, ?, ?,
//       ?, ?, ?,
//       ?, ?,
//       ?, ?, ?, ?, ?,?,
//       NOW()
//     )
//   `;
//
//     db.query(sql, [
//         cus_id, job_status,
//         r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
//         l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
//         pupil_distance, seg_h,
//         prescribed_By_Id, comment, due_date,
//         order_status, lens_id, lens_status,
//         frame_id, frame_status,
//         frame_price, lense_price, price, discount, netPrice,due_amount
//     ], (err, result) => {
//         if (err) {
//             console.error('Job insert failed:', err);
//             return res.status(500).json({ message: 'Job insert failed' });
//         }
//
//         const jobId = result.insertId;
//
//         // ✅ Insert into job_log
//         const logSql = `
//       INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//         const logComment = `Job created for customer`;
//         db.query(logSql, [jobId, "Create new job", "", logComment, created_by || null], (logErr) => {
//             if (logErr) {
//                 console.error("Job log insert failed:", logErr);
//                 // ⚠️ Don’t block response if log fails
//             }
//         });
//
//         res.status(201).json({
//             message: 'Job created successfully',
//             jobId: result.insertId
//         });
//     });
// };

// ✅ Create Job with lens_orded insert
exports.createJob = (req, res) => {
    const {
        cus_id,
        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
        pupil_distance, seg_h,
        prescribed_By_Id, comment, due_date,
        order_status,
        lens_id, lens_status,
        frame_id, frame_status,
        frame_price,
        lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date,
        lense_price, price, discount, netPrice, due_amount
    } = req.body;

    const created_by = req.user?.user_id; // ✅ logged-in user from JWT

    // 🟢 Step 1: Insert into lens_orded
    const lensSql = `
    INSERT INTO lens
    (lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date)
    VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(lensSql, [lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date], (lensErr, lensResult) => {
        if (lensErr) {
            console.error("Lens insert failed:", lensErr);
            return res.status(500).json({ message: "Lens insert failed", error: lensErr });
        }

        const insertedLensId = lensResult.insertId; // ✅ Get lens ID

        // 🟢 Step 2: Insert into job (using new lens ID)
        const jobSql = `
      INSERT INTO job (
        cus_id,
        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
        pupil_distance, seg_h,
        prescribed_By_Id, comment, due_date,
        order_status, lens_id, lens_status,
        frame_id, frame_status,
        frame_price, lense_price, price, discount, netPrice, due_amount,
        create_date
      ) VALUES (
        ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?, ?,
        NOW()
      )
    `;

        db.query(jobSql, [
            cus_id,
            r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
            l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
            pupil_distance, seg_h,
            prescribed_By_Id, comment, due_date,
            order_status, insertedLensId, lens_status,
            frame_id, frame_status,
            frame_price, lense_price, price, discount, netPrice, due_amount
        ], (jobErr, jobResult) => {
            if (jobErr) {
                console.error("Job insert failed:", jobErr);
                return res.status(500).json({ message: "Job insert failed", error: jobErr });
            }

            const jobId = jobResult.insertId;

            // 🟢 Step 3: Insert into job_log
        const logSql = `
        INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `;
            const logComment = `Job created for customer`;

            db.query(logSql, [jobId, "Create new job", "", logComment, created_by || null], (logErr) => {
                if (logErr) {
                    console.error("Job log insert failed:", logErr);
                    // ⚠️ Don't block response if log fails
                }
            });

            // 🟢 Final Response
            res.status(201).json({
                message: "Job created successfully",
                jobId,
                lens_orded_id: insertedLensId
            });
        });
    });
};


// ✅ Get Job Details with customer + billing
exports.getJobDetails = (req, res) => {
    const { job_id } = req.params;

    if (!job_id) {
        return res.status(404).json({ message: "Job id not found" });
    }

    // ✅ Step 1: Fetch job with customer
    const jobSql = `
        SELECT 
            j.*,
            c.cus_id,
            c.name AS customer_name,
            c.address AS customer_address,
            c.mobile AS customer_mobile,
            c.email AS customer_email
        FROM job j
        INNER JOIN customers c ON j.cus_id = c.cus_id
        WHERE j.job_id = ?
    `;

    db.query(jobSql, [job_id], (err, jobResult) => {
        if (err) {
            console.error("Job lookup failed:", err);
            return res.status(500).json({ message: "Job lookup failed" });
        }
        if (jobResult.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const job = jobResult[0];

        // ✅ Step 2: Fetch billing records
        const billingSql = `
            SELECT 
                bill_id,
                amount,
                bill_type,
                payment_method,
                bill_date,
                billed_by
            FROM billing
            WHERE job_id = ?
            AND bill_type <> 'claim'
            ORDER BY bill_date ASC
        `;

        db.query(billingSql, [job_id], (err2, billingRows) => {
            if (err2) {
                console.error("Billing lookup failed:", err2);
                return res.status(500).json({ message: "Billing lookup failed" });
            }

            const totalPaid = billingRows.reduce((sum, row) => sum + row.amount, 0);
            const dueAmount = job.netPrice - totalPaid;

            // ✅ Step 3: Fetch lens details using lens_id (if available)
            if (!job.lens_id) {
                // No lens linked → just send without lens part
                return sendResponse(null);
            }

            const lensSql = `
                SELECT 
                    *
                FROM lens
                WHERE lens_id = ?
            `;

            db.query(lensSql, [job.lens_id], (err3, lensRows) => {
                if (err3) {
                    console.error("Lens lookup failed:", err3);
                    return res.status(500).json({ message: "Lens lookup failed" });
                }

                const lens = lensRows.length > 0 ? lensRows[0] : null;
                sendResponse(lens);
            });

            // ✅ Step 4: Unified response sender
            function sendResponse(lensData) {
                res.status(200).json({
                    job_id: job.job_id,
                    r_sph: job.r_sph,
                    r_cyl: job.r_cyl,
                    r_axis: job.r_axis,
                    r_va: job.r_va,
                    r_iol: job.r_iol,
                    r_add: job.r_add,
                    l_sph: job.l_sph,
                    l_cyl: job.l_cyl,
                    l_axis: job.l_axis,
                    l_va: job.l_va,
                    l_iol: job.l_iol,
                    l_add: job.l_add,
                    lens_status: job.lens_status,
                    lens_id: job.lens_id,
                    frame_status: job.frame_status,
                    frame_id: job.frame_id,
                    pupil_distance: job.pupil_distance,
                    prescribed_By_Id: job.prescribed_By_Id,
                    seg_h: job.seg_h,
                    comment: job.comment,
                    due_date: job.due_date,
                    order_status: job.order_status,
                    create_date: job.create_date,
                    claim_id: job.claim_id,
                    claim_status: job.claim_status,
                    customer: {
                        cus_id: job.cus_id,
                        name: job.customer_name,
                        address: job.customer_address,
                        mobile: job.customer_mobile,
                        email: job.customer_email
                    },
                    pricing: {
                        frame_price: job.frame_price,
                        lense_price: job.lense_price,
                        price: job.price,
                        discount: job.discount,
                        total_price: job.netPrice,
                        total_paid: totalPaid,
                        due_amount: dueAmount
                    },
                    lens: lensData ? {
                        lens_id: lensData.lens_id,
                        lens_category: lensData.lens_category,
                        lens_type: lensData.lens_type,
                        lens_size: lensData.lens_size,
                        lens_color: lensData.lens_color,
                        lens_ordered_by: lensData.lens_ordered_by,
                        lens_ordered_date: lensData.lens_ordered_date
                    } : null,
                    billings: billingRows.map(b => ({
                        bill_id: b.bill_id,
                        amount: b.amount,
                        bill_type: b.bill_type,
                        bill_method: b.payment_method,
                        bill_date: b.bill_date,
                        billed_by: b.billed_by
                    }))
                });
            }
        });
    });
};

// ✅ Update job with logging
exports.updateJob = (req, res) => {
    const { job_id } = req.params;
    const updates = req.body;
    const changed_by = req.user?.user_id; // logged user

    const selectSql = `SELECT * FROM job WHERE job_id = ?`;

    db.query(selectSql, [job_id], (err, result) => {
        if (err) {
            console.error("Job lookup failed:", err);
            return res.status(500).json({ message: "Job lookup failed" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const oldJob = result[0];

        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        // ---------- BUILD UPDATE QUERY ----------
        const setParts = [];
        const values = [];

        fields.forEach(f => {
            setParts.push(`${f} = ?`);
            values.push(updates[f]);
        });

        // ⭐️ If order_status changes → also update datetime column
        if (
            typeof updates.order_status !== "undefined" &&
            updates.order_status != oldJob.order_status
        ) {
            setParts.push(`orderStatus_date = NOW()`);
        }

        // push job_id for WHERE clause
        values.push(job_id);

        const updateSql = `UPDATE job SET ${setParts.join(", ")} WHERE job_id = ?`;

        db.query(updateSql, values, (err2) => {
            if (err2) {
                console.error("Job update failed:", err2);
                return res.status(500).json({ message: "Job update failed" });
            }

            // ---------- LOG CHANGES ----------
            const logSql = `
                INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
                VALUES (?, ?, ?, ?, ?)
            `;

            fields.forEach(field => {
                const oldVal = oldJob[field];
                const newVal = updates[field];

                if (oldVal != newVal) {

                    let fieldName = `${field} updated!`;
                    let oldValue = String(oldVal ?? "");
                    let newValue = String(newVal ?? "");

                    if (field === 'lens_status' && oldVal === 0 && newVal === 1) {
                        fieldName = 'Lens Ready';
                        oldValue = 'Pending';
                        newValue = 'Ready';
                    }
                    else if (field === 'frame_status' && oldVal === 0 && newVal === 1) {
                        fieldName = 'Called';
                        oldValue = 'Pending';
                        newValue = 'Done';
                    }
                    else if (field === 'order_status') {

                        if (oldVal === 1 && newVal === 2) {
                            fieldName = 'Job Ready';
                            oldValue = 'Pending';
                            newValue = 'Ready';
                        }
                        else if (oldVal === 2 && newVal === 3) {
                            fieldName = 'Job Completed';
                            oldValue = 'Ready';
                            newValue = 'Completed';
                        }
                        else if ([1, 2, 3].includes(oldVal) && newVal === 0) {
                            fieldName = 'Job Canceled';
                            oldValue =
                                oldVal === 1 ? 'Pending' :
                                    oldVal === 2 ? 'Ready' :
                                        'Completed';
                            newValue = 'Canceled';
                        }
                    }

                    db.query(
                        logSql,
                        [
                            job_id,
                            fieldName,
                            oldValue,
                            newValue,
                            changed_by
                        ],
                        (logErr) => {
                            if (logErr) {
                                console.error("Job log insert failed:", logErr);
                            }
                        }
                    );
                }
            });

            res.status(200).json({ message: "Job updated successfully" });
        });
    });
};

// ✅ Get Job Logs by Job ID
exports.getJobLogs = (req, res) => {
    const { job_id } = req.params;

    const sql = `
      SELECT 
        jl.log_id,
        jl.job_id,
        jl.field_name,
        jl.old_value,
        jl.new_value,
        u.user_name AS changed_by,
        jl.changed_at
      FROM job_log jl
      LEFT JOIN users u ON u.user_id = jl.changed_by
      WHERE jl.job_id = ?
      ORDER BY jl.changed_at ASC
    `;

    db.query(sql, [job_id], (err, result) => {
        if (err) {
            console.error("Job log lookup failed:", err);
            return res.status(500).json({ message: "Job log lookup failed" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No logs found for this job" });
        }

        res.status(200).json({
            job_id,
            logs: result.map(log => ({
                log_id: log.log_id,
                field_name: log.field_name,
                old_value: log.old_value,
                new_value: log.new_value,
                changed_by: log.changed_by,
                changed_at: log.changed_at
            }))
        });
    });
};

// ✅ Get All Job
exports.getAllJobsByOrderStatus = (req, res) => {
    const { order_status } = req.params;
    const { start_date, end_date, page = 1, limit = 10 } = req.query;

    // ✅ Validate order_status
    if (!order_status) {
        return res.status(400).json({ message: "order_status is required" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Base SQL (main query)
    let sql = `
        SELECT
          j.job_id,
          j.order_status,
     
          j.lens_status,
          j.frame_status,
          j.netPrice,
          j.due_amount,
          j.comment,
          j.create_date,
          j.due_date,
          c.cus_id,
          c.name AS customer_name,
          c.mobile AS customer_mobile,
          c.address AS customer_address
        FROM job j
        INNER JOIN customers c ON j.cus_id = c.cus_id
        WHERE j.order_status = ?
    `;

    // ✅ Count query (to get total)
    let countSql = `
        SELECT COUNT(*) AS total
        FROM job j
        WHERE j.order_status = ?
    `;

    const params = [order_status];
    const countParams = [order_status];

    // ✅ Add date filters (for both queries)
    if (start_date && end_date) {
        sql += ` AND j.create_date BETWEEN ? AND ?`;
        countSql += ` AND j.create_date BETWEEN ? AND ?`;
        params.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
        countParams.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
    } else if (start_date) {
        sql += ` AND j.create_date >= ?`;
        countSql += ` AND j.create_date >= ?`;
        params.push(`${start_date} 00:00:00`);
        countParams.push(`${start_date} 00:00:00`);
    } else if (end_date) {
        sql += ` AND j.create_date <= ?`;
        countSql += ` AND j.create_date <= ?`;
        params.push(`${end_date} 23:59:59`);
        countParams.push(`${end_date} 23:59:59`);
    }

    sql += ` ORDER BY j.create_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    // ✅ First: get total count
    db.query(countSql, countParams, (countErr, countResult) => {
        if (countErr) {
            console.error("Count query failed:", countErr);
            return res.status(500).json({ message: "Count query failed" });
        }

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        // ✅ Then: fetch paginated data
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error("Job lookup failed:", err);
                return res.status(500).json({ message: "Job lookup failed" });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "No jobs found for this order_status and date range" });
            }

            const jobs = result.map(job => ({
                job_id: job.job_id,
                order_status: job.order_status,

                lens_status:job.lens_status,
                frame_status:job.frame_status,
                comment: job.comment,
                netPrice: job.netPrice,
                due_amount: job.due_amount,
                create_date: job.create_date,
                due_date: job.due_date,
                claim_id: job.claim_id,
                claim_status: job.claim_status,
                customer: {
                    cus_id: job.cus_id,
                    name: job.customer_name,
                    mobile: job.customer_mobile,
                    address: job.customer_address
                }
            }));

            res.status(200).json({
                total,
                total_pages: totalPages,
                current_page: parseInt(page),
                limit: parseInt(limit),
                jobs
            });
        });
    });
};

// ✅ Get all jobs for a specific customer (job table only)
exports.getJobsByCustomer = (req, res) => {
    const { cus_id } = req.params;

    if (!cus_id) {
        return res.status(404).json({ message: "Customer ID not found" });
    }

    const sql = `
        SELECT 
            job_id,
            cus_id,
            claim_id,
            claim_status,
            prescribed_By_Id,
            seg_h,        
            due_date,
            order_status,
            create_date,
            frame_price,
            frame_status,
            lense_price,
            lens_status,
            due_amount,
            price,
            discount,
            netPrice
        FROM job
        WHERE cus_id = ?
        ORDER BY create_date DESC`;

    db.query(sql, [cus_id], (err, result) => {
        if (err) {
            console.error("Job lookup failed:", err);
            return res.status(500).json({ message: "Job lookup failed" });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "No jobs found for this customer" });
        }

        res.status(200).json(result);
    });
};

exports.getFullJobDetails = (req, res) => {
    const { job_id } = req.params;

    if (!job_id) {
        return res.status(404).json({ message: "Job id not found" });
    }

    // Small helper to convert db.query → Promise
    const query = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    (async () => {
        try {
            // -----------------------------------------------------
            // 1️⃣ JOB + CUSTOMER
            // -----------------------------------------------------
            const jobSql = `
                SELECT 
                    j.*,
                    c.cus_id,
                    c.name AS customer_name,
                    c.address AS customer_address,
                    c.mobile AS customer_mobile,
                    c.email AS customer_email
                FROM job j
                INNER JOIN customers c ON j.cus_id = c.cus_id
                WHERE j.job_id = ?
            `;
            const jobRows = await query(jobSql, [job_id]);

            if (jobRows.length === 0) {
                return res.status(404).json({ message: "Job not found" });
            }

            const job = jobRows[0];

            // console.log(job)
            // -----------------------------------------------------
            // 2️⃣ BILLING
            // -----------------------------------------------------
            const billingSql = `
                SELECT bill_id, amount, bill_type, payment_method, bill_date, billed_by
                FROM billing
                WHERE job_id = ?
                AND bill_type <> 'claim'
                ORDER BY bill_date ASC
            `;
            const billingRows = await query(billingSql, [job_id]);

            const totalPaid = billingRows.reduce((sum, r) => sum + r.amount, 0);
            const dueAmount = job.netPrice - totalPaid;

            // -----------------------------------------------------
            // 3️⃣ FRAME DETAILS (if available)
            // -----------------------------------------------------
            let frameData = "frame does not exist";

            if (job.frame_id) {
                const frameRows = await query(
                    `SELECT frame_id FROM frame WHERE id = ?`,
                    [job.frame_id]
                );

                frameData = frameRows.length
                    ? frameRows[0].frame_id
                    : "frame does not exist";
            }

            // console.log(frameData);

            // -----------------------------------------------------
            // 4️⃣ PRESCRIBED BY DETAILS
            // -----------------------------------------------------
            let prescribedData = "prescriber does not exist";

            if (job.prescribed_By_Id) {
                const presRows = await query(
                    `SELECT prescribed_By_id, prescribed_By_name FROM prescribedby WHERE prescribed_By_id = ?`,
                    [job.prescribed_By_Id]
                );

                prescribedData = presRows.length
                    ? presRows[0].prescribed_By_name
                    : "prescriber does not exist";
            }

            // console.log(prescribedData);

            // -----------------------------------------------------
            // 5️⃣ LENS DETAILS (full)
            // -----------------------------------------------------
            let lensFull = "lens details not available";

            if (job.lens_id) {
                const lensRows = await query(
                    `SELECT * FROM lens WHERE lens_id = ?`,
                    [job.lens_id]
                );

                if (lensRows.length) {
                    const lens = lensRows[0];

                    const [
                        catRows,
                        typeRows,
                        sizeRows,
                        colorRows,
                        orderedRows
                    ] = await Promise.all([
                        query(`SELECT name FROM lense_category WHERE id = ?`, [lens.lens_category]),
                        query(`SELECT name FROM lense_type WHERE id = ?`, [lens.lens_type]),
                        query(`SELECT name FROM lense_size WHERE id = ?`, [lens.lens_size]),
                        query(`SELECT name FROM lense_color WHERE id = ?`, [lens.lens_color]),
                        query(`SELECT id, order_company_name, Address, Telephone FROM lens_orded WHERE id = ?`, [lens.lens_ordered_by])
                    ]);

                    lensFull = {
                        lens_id: lens.lens_id,

                        lens_category: catRows.length ? catRows[0].name : "lens category does not exist",
                        lens_type: typeRows.length ? typeRows[0].name : "lens type does not exist",
                        lens_size: sizeRows.length ? sizeRows[0].name : "lens size does not exist",
                        lens_color: colorRows.length ? colorRows[0].name : "lens color does not exist",

                        lens_ordered_company: orderedRows.length
                            ? {
                                id: orderedRows[0].id,
                                name: orderedRows[0].order_company_name || "company name missing",
                                address: orderedRows[0].Address || "no address",
                                telephone: orderedRows[0].Telephone || "no telephone"
                            }
                            : "ordered company does not exist",

                        lens_ordered_date: lens.lens_ordered_date || "no date"
                    };
                }
            }

            // console.log(lensFull);
            // -----------------------------------------------------
            // 6️⃣ FINAL RESPONSE
            // -----------------------------------------------------
            res.status(200).json({
                job_id: job.job_id,

                // --- Eye values ---
                r_sph: job.r_sph, r_cyl: job.r_cyl, r_axis: job.r_axis,
                r_va: job.r_va, r_iol: job.r_iol, r_add: job.r_add,

                l_sph: job.l_sph, l_cyl: job.l_cyl, l_axis: job.l_axis,
                l_va: job.l_va, l_iol: job.l_iol, l_add: job.l_add,

                lens_status: job.lens_status,
                frame_status: job.frame_status,
                pupil_distance: job.pupil_distance,
                seg_h: job.seg_h,
                comment: job.comment,
                due_date: job.due_date,
                order_status: job.order_status,
                create_date: job.create_date,

                // --- replaced with full rows ---
                frame: frameData,
                prescribed: prescribedData,

                claimer:{
                  claim_id: job.claim_id,
                  claim_status: job.claim_status,
                  claim_fprice: job.claim_fprice,
                  claim_lprice: job.claim_lprice,
                  claim_date: job.claim_date,
                },

                customer: {
                    cus_id: job.cus_id,
                    name: job.customer_name,
                    address: job.customer_address,
                    mobile: job.customer_mobile,
                    email: job.customer_email
                },

                pricing: {
                    frame_price: job.frame_price,
                    lense_price: job.lense_price,
                    price: job.price,
                    discount: job.discount,
                    total_price: job.netPrice,
                    total_paid: totalPaid,
                    due_amount: dueAmount
                },

                lens: lensFull,

                billings: billingRows.map(b => ({
                    bill_id: b.bill_id,
                    amount: b.amount,
                    bill_type: b.bill_type,
                    bill_method: b.payment_method,
                    bill_date: b.bill_date,
                    billed_by: b.billed_by
                }))
            });

        } catch (err) {
            console.error("Error loading job details:", err);
            res.status(500).json({ message: "Server error" });
        }
    })();
};

// add claimer
exports.addClaimerToJob = (req, res) => {
    const {
        mode,
        jobId,
        claimerId,
        name,
        email,
        mobile,
        lan_number,
        address,
        nic,
        age,
        claim_status,
        claim_fprice,
        claim_lprice
    } = req.body;

    if (!mode || !jobId) {
        return res.status(400).json({
            success: false,
            message: "Mode and jobId are required."
        });
    }

    const billed_by = req.user?.user_id || null;

    // amount = fprice + lprice
    const amount = (Number(claim_fprice) || 0) + (Number(claim_lprice) || 0);

    // Helper: Create billing entry after job update
    const createBilling = (claimer_id_to_return) => {
        const insertBill = `
            INSERT INTO billing 
            (job_id, amount, payment_method, bill_type, bill_date, payment_status, billed_by)
            VALUES (?, ?, 'cash', 'claim', NOW(), 1, ?)
        `;

        db.query(insertBill, [jobId, amount, billed_by], (err2, billResult) => {
            if (err2) {
                console.error("Billing insert failed:", err2);
                return res.status(500).json({
                    success: false,
                    message: "Failed to create billing."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Claimer updated & bill created successfully.",
                claimer_id: claimer_id_to_return,
                billId: billResult.insertId
            });
        });
    };

    // -----------------------------------------------------------
    // MODE: NEW — insert customer then update job
    // -----------------------------------------------------------
    if (mode === "new") {
        const insertCustomer = `
            INSERT INTO customers
            (name, email, mobile, lan_number, address, nic, age, create_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        db.query(
            insertCustomer,
            [name, email, mobile, lan_number, address, nic, age],
            (err, customerResult) => {
                if (err) {
                    console.error("Customer insert failed:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to create customer."
                    });
                }

                const newClaimerId = customerResult.insertId;

                const updateJob = `
                    UPDATE job
                    SET 
                        claim_id = ?, 
                        claim_status = ?, 
                        claim_fprice = ?, 
                        claim_lprice = ?, 
                        claim_date = NOW()
                    WHERE job_id = ?
                `;

                db.query(
                    updateJob,
                    [newClaimerId, claim_status, claim_fprice, claim_lprice, jobId],
                    (err2) => {
                        if (err2) {
                            console.error("Job update failed:", err2);
                            return res.status(500).json({
                                success: false,
                                message: "Failed to update job."
                            });
                        }

                        // -------------------------------------------------
                        // LOG ENTRY FOR CLAIM ADD (mode: new)
                        // -------------------------------------------------
                        const logSql = `
                            INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
                            VALUES (?, ?, ?, ?, ?)
                        `;

                        const logComment = `Claim added for job`;

                        db.query(
                            logSql,
                            [jobId, "Claim add", "", logComment, billed_by],
                            (logErr) => {
                                if (logErr) {
                                    console.error("Claim log insert failed:", logErr);
                                }
                            }
                        );
                        // -------------------------------------------------

                        return createBilling(newClaimerId);
                    }
                );
            }
        );

        return;
    }

    // -----------------------------------------------------------
    // MODE: EXISTING — only update job
    // -----------------------------------------------------------
    if (mode === "existing") {
        const updateJob = `
            UPDATE job
            SET 
                claim_id = ?, 
                claim_status = ?, 
                claim_fprice = ?, 
                claim_lprice = ?, 
                claim_date = NOW()
            WHERE job_id = ?
        `;

        db.query(
            updateJob,
            [claimerId, claim_status, claim_fprice, claim_lprice, jobId],
            (err) => {
                if (err) {
                    console.error("Job update failed:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to update job."
                    });
                }

                // -------------------------------------------------
                // LOG ENTRY FOR CLAIM ADD (mode: existing)
                // -------------------------------------------------
                const logSql = `
                    INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
                    VALUES (?, ?, ?, ?, ?)
                `;

                const logComment = `Claim added for job`;

                db.query(
                    logSql,
                    [jobId, "Claim add", "", logComment, billed_by],
                    (logErr) => {
                        if (logErr) {
                            console.error("Claim log insert failed:", logErr);
                        }
                    }
                );
                // -------------------------------------------------

                return createBilling(claimerId);
            }
        );
    }
};





