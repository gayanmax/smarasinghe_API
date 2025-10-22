const db = require('../db');

// ✅ Create Job
exports.createJob = (req, res) => {
    const {
        cus_id,
        job_status,
        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
        pupil_distance, seg_h,
        prescribed_By_Id, comment, due_date,
        order_status, lens_id, lens_status,
        frame_id, frame_status,
        frame_price, lense_price, price, discount, netPrice,due_amount
    } = req.body;

    const created_by = req.user?.user_id; // ✅ logged-in user from JWT

    const sql = `
    INSERT INTO job (
      cus_id, job_status,
      r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
      l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
      pupil_distance, seg_h,
      prescribed_By_Id, comment, due_date,
      order_status, lens_id, lens_status,
      frame_id, frame_status,
      frame_price, lense_price, price, discount, netPrice,due_amount,
      create_date
    ) VALUES (
      ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?,?,
      NOW()
    )
  `;

    db.query(sql, [
        cus_id, job_status,
        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
        pupil_distance, seg_h,
        prescribed_By_Id, comment, due_date,
        order_status, lens_id, lens_status,
        frame_id, frame_status,
        frame_price, lense_price, price, discount, netPrice,due_amount
    ], (err, result) => {
        if (err) {
            console.error('Job insert failed:', err);
            return res.status(500).json({ message: 'Job insert failed' });
        }

        const jobId = result.insertId;

        // ✅ Insert into job_log
        const logSql = `
      INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
      VALUES (?, ?, ?, ?, ?)
    `;
        const logComment = `Job created for customer`;
        db.query(logSql, [jobId, "Create new job", "", logComment, created_by || null], (logErr) => {
            if (logErr) {
                console.error("Job log insert failed:", logErr);
                // ⚠️ Don’t block response if log fails
            }
        });

        res.status(201).json({
            message: 'Job created successfully',
            jobId: result.insertId
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
      ORDER BY bill_date ASC
    `;

        db.query(billingSql, [job_id], (err2, billingRows) => {
            if (err2) {
                console.error("Billing lookup failed:", err2);
                return res.status(500).json({ message: "Billing lookup failed" });
            }

            const totalPaid = billingRows.reduce((sum, row) => sum + row.amount, 0);
            const dueAmount = job.netPrice - totalPaid;

            res.status(200).json({
                job_id: job.job_id,
                job_status: job.job_status,
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
                lens_status:job.lens_status,
                frame_status:job.frame_status,
                pupil_distance: job.pupil_distance,
                prescribed_By_Id: job.prescribed_By_Id,
                seg_h: job.seg_h,
                comment: job.comment,
                due_date: job.due_date,
                order_status: job.order_status,
                create_date: job.create_date,
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
                billings: billingRows.map(b => ({
                    bill_id: b.bill_id,
                    amount: b.amount,
                    bill_type: b.bill_type,
                    bill_method:b.payment_method,
                    bill_date: b.bill_date,
                    billed_by: b.billed_by
                }))
            });
        });
    });
};

// ✅ Update job with logging
exports.updateJob = (req, res) => {
    const { job_id } = req.params;
    const updates = req.body;
    const changed_by = req.user?.user_id; // logged user

    // Step 1: Fetch current job record
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

        // Step 2: Build update query
        const fields = Object.keys(updates);
        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields to update" });
        }

        const setClause = fields.map(f => `${f} = ?`).join(", ");
        const values = fields.map(f => updates[f]);
        values.push(job_id);

        const updateSql = `UPDATE job SET ${setClause} WHERE job_id = ?`;

        db.query(updateSql, values, (err2) => {
            if (err2) {
                console.error("Job update failed:", err2);
                return res.status(500).json({ message: "Job update failed" });
            }

            // Step 3: Insert logs for changed fields
            const logSql = `
        INSERT INTO job_log (job_id, field_name, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `;

            fields.forEach(field => {
                if (oldJob[field] != updates[field]) {
                    db.query(logSql, [job_id, field, String(oldJob[field] ?? ""), String(updates[field] ?? ""), changed_by]);
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
      log_id,
      job_id,
      field_name,
      old_value,
      new_value,
      changed_by,
      changed_at
    FROM job_log
    WHERE job_id = ?
    ORDER BY changed_at ASC
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
          j.job_status,
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
                job_status: job.job_status,
                comment: job.comment,
                netPrice: job.netPrice,
                due_amount: job.due_amount,
                create_date: job.create_date,
                due_date: job.due_date,
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


