const db = require('../db');


// ✅ Create Job with lens_orded insert
// exports.createJob = (req, res) => {
//     const {
//         cus_id,
//         r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
//         l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
//         pupil_distance, seg_h,
//         prescribed_By_Id, comment, dm, htn, due_date,
//         order_status,
//         lens_id, lens_status,
//         frame_id, frame_material, frame_category, frame_type, frame_status,
//         frame_price,
//         lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date,
//         lense_price, price, discount, netPrice, is_claimer, due_amount,
//     } = req.body;
//
//     const created_by = req.user?.user_id;
//
//     /* ---------------- STEP 1: INSERT LENS ---------------- */
//     const lensSql = `
//         INSERT INTO lens
//         (lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date)
//         VALUES (?, ?, ?, ?, ?, ?)
//     `;
//
//     db.query(
//         lensSql,
//         [lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date],
//         (lensErr, lensResult) => {
//             if (lensErr) {
//                 console.error("Lens insert failed:", lensErr);
//                 return res.status(500).json({ message: "Lens insert failed" });
//             }
//
//             const insertedLensId = lensResult.insertId;
//
//             /* ---------------- STEP 2: GET FRAME PRICES ---------------- */
//             const frameSql = `
//                 SELECT frame_selling_price, frame_discount_price
//                 FROM frame
//                 WHERE id = ?
//             `;
//
//             db.query(frameSql, [frame_id], (frameErr, frameResult) => {
//                 if (frameErr) {
//                     console.error("Frame fetch failed:", frameErr);
//                     return res.status(500).json({ message: "Frame fetch failed" });
//                 }
//
//                 if (frameResult.length === 0) {
//                     return res.status(404).json({ message: "Frame not found" });
//                 }
//
//                 const {
//                     frame_selling_price,
//                     frame_discount_price
//                 } = frameResult[0];
//
//                 // 🧮 Calculate frame deduction
//                 const frame_deduction =
//                     Number(frame_selling_price || 0) -
//                     Number(frame_discount_price || 0);
//
//                 /* ---------------- STEP 3: INSERT JOB ---------------- */
//                 const jobSql = `
//                     INSERT INTO job (
//                         cus_id,
//                         r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
//                         l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
//                         pupil_distance, seg_h,
//                         prescribed_By_Id, comment, dm, htn, due_date,
//                         order_status, lens_id, lens_status,
//                         frame_id, frame_material, frame_category, frame_type, frame_status,
//                         frame_price, frame_deduction,
//                         lense_price, price, discount, netPrice, is_claimer, due_amount,
//                         create_date
//                     ) VALUES (
//                         ?,
//                         ?, ?, ?, ?, ?, ?,
//                         ?, ?, ?, ?, ?, ?,
//                         ?, ?,
//                         ?, ?, ?, ?, ?,
//                         ?, ?, ?,
//                         ?, ?, ?, ?, ?,
//                         ?, ?,
//                         ?, ?, ?, ?, ?, ?,
//                         NOW()
//                     )
//                 `;
//
//                 db.query(
//                     jobSql,
//                     [
//                         cus_id,
//                         r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
//                         l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
//                         pupil_distance, seg_h,
//                         prescribed_By_Id, comment, dm, htn, due_date,
//                         order_status, insertedLensId, lens_status,
//                         frame_id, frame_material, frame_category, frame_type, frame_status,
//                         frame_price, frame_deduction,
//                         lense_price, price, discount, netPrice, is_claimer, due_amount
//                     ],
//                     (jobErr, jobResult) => {
//                         if (jobErr) {
//                             console.error("Job insert failed:", jobErr);
//                             return res.status(500).json({ message: "Job insert failed" });
//                         }
//
//                         const jobId = jobResult.insertId;
//
//                         /* ---------------- STEP 4: JOB LOG ---------------- */
//                         const logSql = `
//                             INSERT INTO job_log
//                             (job_id, field_name, old_value, new_value, changed_by)
//                             VALUES (?, ?, ?, ?, ?)
//                         `;
//
//                         db.query(
//                             logSql,
//                             [jobId, "Create new job", "", "Job created for customer", created_by || null],
//                             () => {}
//                         );
//
//                         /* ---------------- FINAL RESPONSE ---------------- */
//                         res.status(201).json({
//                             message: "Job created successfully",
//                             jobId,
//                             lens_orded_id: insertedLensId,
//                             frame_deduction
//                         });
//                     }
//                 );
//             });
//         }
//     );
// };

exports.createJob = (req, res) => {
    const {
        cus_id,
        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
        pupil_distance, seg_h,
        prescribed_By_Id, comment, dm, htn, due_date,
        order_status,
        lens_id, lens_status,
        frame_id, frame_material, frame_category, frame_type, frame_status,
        frame_price,
        lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date,
        lense_price, price, discount, netPrice, is_claimer, due_amount,
    } = req.body;

    const created_by = req.user?.user_id;

    /* ---------------- STEP 1: INSERT LENS ---------------- */
    const lensSql = `
        INSERT INTO lens
        (lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        lensSql,
        [lens_category, lens_type, lens_color, lens_size, lens_ordered_by, lens_ordered_date],
        (lensErr, lensResult) => {
            if (lensErr) {
                console.error("Lens insert failed:", lensErr);
                return res.status(500).json({ message: "Lens insert failed" });
            }

            const insertedLensId = lensResult.insertId;

            /* ---------------- STEP 2: HANDLE FRAME ---------------- */

            const insertJobWithFrameDeduction = (frame_deduction) => {

                /* ---------------- STEP 3: INSERT JOB ---------------- */
                const jobSql = `
                    INSERT INTO job (
                        cus_id,
                        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
                        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
                        pupil_distance, seg_h,
                        prescribed_By_Id, comment, dm, htn, due_date,
                        order_status, lens_id, lens_status,
                        frame_id, frame_material, frame_category, frame_type, frame_status,
                        frame_price, frame_deduction,
                        lense_price, price, discount, netPrice, is_claimer, due_amount,
                        create_date
                    ) VALUES (
                        ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        NOW()
                    )
                `;

                db.query(
                    jobSql,
                    [
                        cus_id,
                        r_sph, r_cyl, r_axis, r_va, r_iol, r_add,
                        l_sph, l_cyl, l_axis, l_va, l_iol, l_add,
                        pupil_distance, seg_h,
                        prescribed_By_Id, comment, dm, htn, due_date,
                        order_status, insertedLensId, lens_status,
                        frame_id, frame_material, frame_category, frame_type, frame_status,
                        frame_price, frame_deduction,
                        lense_price, price, discount, netPrice, is_claimer, due_amount
                    ],
                    (jobErr, jobResult) => {
                        if (jobErr) {
                            console.error("Job insert failed:", jobErr);
                            return res.status(500).json({ message: "Job insert failed" });
                        }

                        const jobId = jobResult.insertId;

                        /* ---------------- STEP 4: JOB LOG ---------------- */
                        const logSql = `
                            INSERT INTO job_log
                            (job_id, field_name, old_value, new_value, changed_by)
                            VALUES (?, ?, ?, ?, ?)
                        `;

                        db.query(
                            logSql,
                            [jobId, "Create new job", "", "Job created for customer", created_by || null],
                            () => {}
                        );

                        /* ---------------- FINAL RESPONSE ---------------- */
                        res.status(201).json({
                            message: "Job created successfully",
                            jobId,
                            lens_orded_id: insertedLensId,
                            frame_deduction
                        });
                    }
                );
            };

            /* -------- CONDITION CHECK -------- */

            if (Number(frame_id) === 0) {

                // ✅ Own / Own Removed case
                insertJobWithFrameDeduction(0);

            } else {

                // ✅ Normal frame case
                const frameSql = `
                    SELECT frame_selling_price, frame_discount_price
                    FROM frame
                    WHERE id = ?
                `;

                db.query(frameSql, [frame_id], (frameErr, frameResult) => {
                    if (frameErr) {
                        console.error("Frame fetch failed:", frameErr);
                        return res.status(500).json({ message: "Frame fetch failed" });
                    }

                    if (frameResult.length === 0) {
                        return res.status(404).json({ message: "Frame not found" });
                    }

                    const {
                        frame_selling_price,
                        frame_discount_price
                    } = frameResult[0];

                    const frame_deduction =
                        Number(frame_selling_price || 0) -
                        Number(frame_discount_price || 0);

                    insertJobWithFrameDeduction(frame_deduction);
                });
            }
        }
    );
};

exports.updateJobDetails = (req, res) => {
    const job_id = req.params.job_id;
    const data = req.body;

    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({message: "Connection error"});
        }

        connection.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ message: "Transaction error" });
        }

        /* -------------------------------------------------- */
        /* 1️⃣ CHECK ORDER STATUS                             */
        /* -------------------------------------------------- */
            connection.query(
            "SELECT order_status FROM job WHERE job_id = ?",
            [job_id],
            (err, statusResult) => {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).json({ message: "DB error" });
                    });
                }

                if (statusResult.length === 0) {
                    return connection.rollback(() => {
                        res.status(404).json({ message: "Job not found" });
                    });
                }

                const orderStatus = statusResult[0].order_status;

                if (orderStatus === 3 || orderStatus === 0) {
                    return connection.rollback(() => {
                        res.status(400).json({
                            message: "This job can't change"
                        });
                    });
                }

                /* -------------------------------------------------- */
                /* 2️⃣ UPDATE LENS TABLE                              */
                /* -------------------------------------------------- */
                connection.query(
                    `UPDATE lens 
                     SET lens_category = ?, 
                         lens_type = ?, 
                         lens_color = ?, 
                         lens_size = ?, 
                         lens_ordered_by = ?
                     WHERE lens_id = ?`,
                    [
                        data.lens_category,
                        data.lens_type,
                        data.lens_color,
                        data.lens_size,
                        data.lens_ordered_by,
                        data.lens_id
                    ],
                    (err) => {
                        if (err) {
                            return connection.rollback(() => {
                                res.status(500).json({ message: "Lens update failed" });
                            });
                        }

                        /* -------------------------------------------------- */
                        /* 3️⃣ GET CURRENT JOB                               */
                        /* -------------------------------------------------- */
                        connection.query(
                            "SELECT frame_id, netPrice, due_amount, frame_deduction FROM job WHERE job_id = ?",
                            [job_id],
                            (err, jobResult) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        res.status(500).json({ message: "Job fetch error" });
                                    });
                                }

                                const oldJob = jobResult[0];

                                let frameDeduction = oldJob.frame_deduction;
                                let newDueAmount = oldJob.due_amount;

                                /* -------------------------------------------------- */
                                /* 4️⃣ FRAME CHECK (SEPARATE LOGIC)                 */
                                /* -------------------------------------------------- */

                                const handleNetPriceLogic = () => {

                                    /* -------------------------------------------------- */
                                    /* 5️⃣ NET PRICE CHECK (SEPARATE LOGIC)             */
                                    /* -------------------------------------------------- */

                                    const oldNet = Number(oldJob.netPrice);
                                    const newNet = Number(data.netPrice);

                                    if (newNet > oldNet) {
                                        const difference = newNet - oldNet;
                                        newDueAmount = Number(oldJob.due_amount) + difference;
                                    }

                                    /* -------------------------------------------------- */
                                    /* 6️⃣ UPDATE JOB TABLE                             */
                                    /* -------------------------------------------------- */

                                    connection.query(
                                        `UPDATE job SET
                                            r_sph=?, r_cyl=?, r_axis=?, r_va=?, r_iol=?, r_add=?,
                                            l_sph=?, l_cyl=?, l_axis=?, l_va=?, l_iol=?, l_add=?,
                                            pupil_distance=?, seg_h=?,
                                            prescribed_By_Id=?, comment=?, dm=?, htn=?, due_date=?,
                                            frame_id=?, frame_material=?, frame_type=?,
                                            frame_price=?, frame_deduction=?,
                                            lense_price=?, price=?, discount=?, netPrice=?, due_amount=?
                                         WHERE job_id=?`,
                                        [
                                            data.r_sph, data.r_cyl, data.r_axis, data.r_va, data.r_iol, data.r_add,
                                            data.l_sph, data.l_cyl, data.l_axis, data.l_va, data.l_iol, data.l_add,
                                            data.pupil_distance, data.seg_h,
                                            data.prescribed_By_Id, data.comment,
                                            data.dm, data.htn, data.due_date,
                                            data.frame_id, data.frame_material, data.frame_type,
                                            data.frame_price, frameDeduction,
                                            data.lense_price, data.price, data.discount,
                                            data.netPrice, newDueAmount,
                                            job_id
                                        ],
                                        (err) => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    res.status(500).json({ message: "Job update failed" });
                                                });
                                            }

                                            connection.commit((err) => {
                                                if (err) {
                                                    return connection.rollback(() => {
                                                        res.status(500).json({ message: "Commit failed" });
                                                    });
                                                }

                                                res.status(200).json({
                                                    message: "Job updated successfully"
                                                });
                                            });
                                        }
                                    );
                                };

                                // FRAME CHECK LOGIC
                                if (oldJob.frame_id !== data.frame_id && data.frame_id !== 0) {

                                    connection.query(
                                        `SELECT frame_selling_price, frame_discount_price
                                         FROM frame
                                         WHERE id = ?`,
                                        [data.frame_id],
                                        (err, frameResult) => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    res.status(500).json({ message: "Frame fetch error" });
                                                });
                                            }

                                            if (frameResult.length > 0) {
                                                const selling = frameResult[0].frame_selling_price || 0;
                                                const discount = frameResult[0].frame_discount_price || 0;

                                                frameDeduction = selling - discount;
                                            }

                                            handleNetPriceLogic();
                                        }
                                    );

                                } else {
                                    handleNetPriceLogic();
                                }

                            }
                        );
                    }
                );
            }
        );
    });
    });
};

// ✅ Get Job Details with customer + billing + temp_billing + frame + lens meta
exports.getJobDetails = (req, res) => {
    const { job_id } = req.params;

    if (!job_id) {
        return res.status(404).json({ message: "Job id not found" });
    }

    // ===== Step 1: Job + Customer =====
    const jobSql = `
        SELECT 
            j.*,
            c.cus_id,
            c.name AS customer_name,
            c.address AS customer_address,
            c.mobile AS customer_mobile,
            c.lan_number AS customer_lan_number,
            c.age AS customer_age,
            c.nic AS customer_nic,
            c.email AS customer_email
        FROM job j
        INNER JOIN customers c ON j.cus_id = c.cus_id
        WHERE j.job_id = ?
    `;

    db.query(jobSql, [job_id], (err, jobResult) => {
        if (err) return res.status(500).json({ message: "Job lookup failed" });
        if (!jobResult.length) return res.status(404).json({ message: "Job not found" });

        const job = jobResult[0];

        // ===== Step 2: Billing =====
        const billingSql = `
            SELECT bill_id, amount, due_amount, bill_type, payment_method, bill_date, is_claimer_bill, billed_by
            FROM billing
            WHERE job_id = ?
            AND bill_type <> 'claim'
            ORDER BY bill_date ASC
        `;

        const tempBillingSql = `
            SELECT bill_id, amount, due_amount, bill_type, payment_method, bill_date, billed_by
            FROM temp_billing
            WHERE job_id = ?
            ORDER BY bill_date ASC
        `;

        db.query(billingSql, [job_id], (err2, billingRows) => {
            if (err2) return res.status(500).json({ message: "Billing lookup failed" });

            db.query(tempBillingSql, [job_id], (err3, tempBillingRows) => {
                if (err3) return res.status(500).json({ message: "Temp billing lookup failed" });

                const billingTotal = billingRows.reduce((s, r) => s + Number(r.amount || 0), 0);
                const tempBillingTotal = tempBillingRows.reduce((s, r) => s + Number(r.amount || 0), 0);
                const totalPaid = billingTotal + tempBillingTotal;
                const dueAmount = Number(job.netPrice || 0) - totalPaid;

                // ===== Step 3: Frame lookup (optional) =====
                const getFrame = (cb) => {
                    if (!job.frame_id) return cb(null);

                    db.query(
                        `
                            SELECT 
                                frame_id,
                                frame_brand
                            FROM frame
                            WHERE id = ?
                            `,
                        [job.frame_id],
                        (err, rows) => {
                            if (err || !rows.length) return cb(null);

                            cb({
                                frame_id: rows[0].frame_id,
                                frame_brand: rows[0].frame_brand
                            });
                        }
                    );
                };

                // ===== Step 4: Lens lookup (optional, meta only) =====
                const getLens = (cb) => {
                    if (!job.lens_id) return cb(null);

                    const sql = `
                        SELECT
                            l.lens_id,
                
                            lc.id   AS lens_category_id,
                            lc.name AS lens_category_name,
                
                            lco.id   AS lens_color_id,
                            lco.name AS lens_color_name,
                
                            lt.id   AS lens_type_id,
                            lt.name AS lens_type_name,
                
                            ls.id   AS lens_size_id,
                            ls.name AS lens_size_name,
                            
                            lo.id   AS lens_order_id,
                            lo.order_company_name   AS lens_order_name,
                            lo.Telephone          AS lens_order_telephone,
                            
                            l.lens_ordered_date
                            
                        FROM lens l
                        LEFT JOIN lense_category lc ON l.lens_category = lc.id
                        LEFT JOIN lense_color    lco ON l.lens_color    = lco.id
                        LEFT JOIN lense_type     lt  ON l.lens_type     = lt.id
                        LEFT JOIN lense_size     ls  ON l.lens_size     = ls.id
                        LEFT JOIN lens_orded     lo  ON l.lens_ordered_by = lo.id
                
                        WHERE l.lens_id = ?
                    `;

                    db.query(sql, [job.lens_id], (err, rows) => {
                        if (err) return cb(null);
                        cb(rows[0] || null);
                    });
                };

                const getPrescriber = (cb) => {
                    if (!job.prescribed_By_Id) return cb(null);

                    db.query(
                        `SELECT prescribed_By_name FROM prescribedby WHERE prescribed_By_id = ?`,
                        [job.prescribed_By_Id],
                        (err, rows) => {
                            if (err) return cb(null);
                            cb(rows[0]?.prescribed_By_name || null);
                        }
                    );
                };

                // ===== Execute lookups =====
                getFrame((frame) => {
                    getLens((lensMeta) => {
                        getPrescriber((prescriber) => {
                            res.status(200).json({
                                job_id: job.job_id,

                                // --- prescription ---
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

                                dm: job.dm,
                                htn: job.htn,
                                // --- lens ---
                                lens_id: job.lens_id,
                                lens_status: job.lens_status,
                                lens_meta: lensMeta, // ✅ added, id untouched

                                // --- frame ---
                                frame_id: job.frame_id,
                                frame_name: frame?.frame_id || null,
                                frame_brand: frame?.frame_brand || null,
                                frame_status: job.frame_status,
                                frame_material: job.frame_material,
                                frame_category: job.frame_category,
                                frame_type: job.frame_type,

                                pupil_distance: job.pupil_distance,
                                prescribed_By_Id: job.prescribed_By_Id,
                                prescriber:prescriber,
                                seg_h: job.seg_h,
                                comment: job.comment,
                                due_date: job.due_date,
                                order_status: job.order_status,
                                create_date: job.create_date,
                                is_claimer: job.is_claimer,
                                job_status: job.job_status,

                                customer: {
                                    cus_id: job.cus_id,
                                    name: job.customer_name,
                                    address: job.customer_address,
                                    mobile: job.customer_mobile,
                                    lan_number: job.customer_lan_number,
                                    email: job.customer_email,
                                    age: job.customer_age,
                                    nic: job.customer_nic
                                },

                                pricing: {
                                    total_price: job.netPrice,
                                    frame_price: job.frame_price,
                                    lens_price: job.lense_price,
                                    discount: job.discount,
                                    billing_paid: billingTotal,
                                    temp_billing_paid: tempBillingTotal,
                                    total_paid: totalPaid,
                                    due_amount: dueAmount,
                                    price: job.price
                                },

                                billing: billingRows,
                                temp_billing: tempBillingRows
                            });
                        });
                    });
                });
            });
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
          j.job_status,
          j.is_claimer,
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
                job_status:job.job_status,
                is_claimer:job.is_claimer,
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
            is_claimer,     
            due_date,
            order_status,
            create_date,
            frame_status,
            job_status,
            lens_status,
            due_amount,
            price,
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
                SELECT bill_id, amount, due_amount, bill_type, payment_method, bill_date, billed_by
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
                    due_amount: b.due_amount,
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
    const { claimId, jobId } = req.body;
    const userId = req.user?.user_id;

    if (!claimId || !jobId) {
        return res.status(400).json({
            message: "Claim ID and Job ID are required",
        });
    }

    if (!userId) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    /* 1️⃣ Update selected job (jobId) → is_claimer = 2 */
    const updateJobSql = `
        UPDATE job
        SET is_claimer = 2
        WHERE job_id = ?
    `;

    db.query(updateJobSql, [jobId], (err, result) => {
        if (err) {
            console.error("Update job error:", err);
            return res.status(500).json({
                message: "Failed to update job claimer status",
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        /* 2️⃣ Select claim job → get due_amount */
        const selectClaimJobSql = `
            SELECT netPrice
            FROM job
            WHERE job_id = ?
            LIMIT 1
        `;

        db.query(selectClaimJobSql, [claimId], (err, rows) => {
            if (err) {
                console.error("Select claim job error:", err);
                return res.status(500).json({
                    message: "Failed to fetch claim job",
                });
            }

            if (rows.length === 0) {
                return res.status(404).json({
                    message: "Claim job not found",
                });
            }

            const netPrice = rows[0].netPrice;

            /* 3️⃣ Create billing record */
            const insertBillingSql = `
                INSERT INTO billing (
                    job_id,
                    amount,
                    payment_method,
                    bill_type,
                    bill_date,
                    payment_status,
                    is_claimer_bill,
                    billed_by
                ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
            `;

            db.query(
                insertBillingSql,
                [
                    claimId,
                    netPrice,
                    "Cash",
                    "Final Payment",
                    1,
                    1,
                    userId,
                ],
                (err, billingResult) => {
                    if (err) {
                        console.error("Insert billing error:", err);
                        return res.status(500).json({
                            message: "Failed to create billing",
                        });
                    }

                    const billId = billingResult.insertId; // ✅ created bill number

                    /* 4️⃣ Update claim job → due_amount = 0, order_status = 3 */
                    const updateClaimJobSql = `
                        UPDATE job
                        SET due_amount = 0,
                            order_status = 3
                        WHERE job_id = ?
                    `;

                    db.query(updateClaimJobSql, [claimId], (err) => {
                        if (err) {
                            console.error("Update claim job error:", err);
                            return res.status(500).json({
                                message: "Failed to finalize claim job",
                            });
                        }

                        /* ✅ SUCCESS */
                        return res.status(200).json({
                            claimId,
                            bill_id: billId, // 👈 sent to frontend
                            message: "Claimer added successfully",
                        });
                    });
                }
            );
        });
    });
};

exports.getAllOpticalMasters = (req, res) => {

    const tables = {
        lense_category: 'SELECT id, name FROM lense_category WHERE status = 1',
        lense_type: 'SELECT id, name FROM lense_type WHERE status = 1',
        lense_color: 'SELECT id, name FROM lense_color WHERE status = 1',
        lense_size: 'SELECT id, name FROM lense_size WHERE status = 1',
        lens_orded: 'SELECT id, order_company_name FROM lens_orded WHERE is_active = 1',

        frame_brand: 'SELECT id, name FROM frame_brand WHERE status = 1',
        prescribed: 'SELECT prescribed_By_Id, prescribed_By_name FROM prescribedby ORDER BY prescribed_By_Id DESC',

        job_last_id: 'SELECT job_id FROM job ORDER BY job_id DESC LIMIT 1'
    };

    const result = {};
    const tableKeys = Object.keys(tables);
    let completed = 0;

    tableKeys.forEach(table => {
        db.query(tables[table], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Database error' });
            }

            result[table] = rows;
            completed++;

            if (completed === tableKeys.length) {
                res.status(200).json(result);
            }
        });
    });
};

// exports.getAllClaimJobs = (req, res) => {
//     const { start_date, end_date, page = 1, limit = 10 } = req.query;
//
//     const offset = (parseInt(page) - 1) * parseInt(limit);
//
//     // ✅ Base SQL (main query)
//     let sql = `
//         SELECT
//           j.job_id,
//           j.order_status,
//
//           j.lens_status,
//           j.frame_status,
//           j.netPrice,
//           j.due_amount,
//           j.comment,
//           j.create_date,
//           j.due_date,
//           c.cus_id,
//           c.name AS customer_name,
//           c.mobile AS customer_mobile,
//           c.address AS customer_address
//         FROM job j
//         INNER JOIN customers c ON j.cus_id = c.cus_id
//         WHERE j.order_status = 3 AND is_claimer = 1
//     `;
//
//     // ✅ Count query (to get total)
//     let countSql = `
//         SELECT COUNT(*) AS total
//         FROM job j
//         WHERE j.order_status = 3 AND is_claimer = 1
//     `;
//
//     const params = [];
//     const countParams = [];
//
//     // ✅ Add date filters (for both queries)
//     if (start_date && end_date) {
//         sql += ` AND j.create_date BETWEEN ? AND ?`;
//         countSql += ` AND j.create_date BETWEEN ? AND ?`;
//         params.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
//         countParams.push(`${start_date} 00:00:00`, `${end_date} 23:59:59`);
//     } else if (start_date) {
//         sql += ` AND j.create_date >= ?`;
//         countSql += ` AND j.create_date >= ?`;
//         params.push(`${start_date} 00:00:00`);
//         countParams.push(`${start_date} 00:00:00`);
//     } else if (end_date) {
//         sql += ` AND j.create_date <= ?`;
//         countSql += ` AND j.create_date <= ?`;
//         params.push(`${end_date} 23:59:59`);
//         countParams.push(`${end_date} 23:59:59`);
//     }
//
//     sql += ` ORDER BY j.create_date DESC LIMIT ? OFFSET ?`;
//     params.push(parseInt(limit), offset);
//
//     // ✅ First: get total count
//     db.query(countSql, countParams, (countErr, countResult) => {
//         if (countErr) {
//             console.error("Count query failed:", countErr);
//             return res.status(500).json({ message: "Count query failed" });
//         }
//
//         const total = countResult[0]?.total || 0;
//         const totalPages = Math.ceil(total / limit);
//
//         // ✅ Then: fetch paginated data
//         db.query(sql, params, (err, result) => {
//             if (err) {
//                 console.error("Job lookup failed:", err);
//                 return res.status(500).json({ message: "Job lookup failed" });
//             }
//
//             if (result.length === 0) {
//                 return res.status(404).json({ message: "No jobs found for this order_status and date range" });
//             }
//
//             const jobs = result.map(job => ({
//                 job_id: job.job_id,
//                 order_status: job.order_status,
//
//                 lens_status:job.lens_status,
//                 frame_status:job.frame_status,
//                 comment: job.comment,
//                 netPrice: job.netPrice,
//                 due_amount: job.due_amount,
//                 create_date: job.create_date,
//                 due_date: job.due_date,
//                 customer: {
//                     cus_id: job.cus_id,
//                     name: job.customer_name,
//                     mobile: job.customer_mobile,
//                     address: job.customer_address
//                 }
//             }));
//
//             res.status(200).json({
//                 total,
//                 total_pages: totalPages,
//                 current_page: parseInt(page),
//                 limit: parseInt(limit),
//                 jobs
//             });
//         });
//     });
// };

// get all claim jobs
exports.getAllClaimJobs = (req, res) => {
    const { start_date, end_date, page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;

    // ================= BASE QUERY =================
    let sql = `
        SELECT
            j.job_id,
            j.order_status,
            j.lens_status,
            j.frame_status,
            j.is_claimer,
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
        WHERE j.order_status = 3
          AND j.is_claimer IN (1, 2)
    `;

    let countSql = `
        SELECT COUNT(*) AS total
        FROM job j
        WHERE j.order_status = 3
          AND j.is_claimer IN (1, 2)
    `;

    const params = [];
    const countParams = [];

    // ================= DATE FILTERS =================
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

    // ================= PAGINATION =================
    sql += ` ORDER BY j.create_date DESC LIMIT ? OFFSET ?`;
    params.push(parsedLimit, offset);

    // ================= COUNT QUERY =================
    db.query(countSql, countParams, (countErr, countResult) => {
        if (countErr) {
            console.error("Count query failed:", countErr);
            return res.status(500).json({ message: "Count query failed" });
        }

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / parsedLimit);

        // ================= DATA QUERY =================
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error("Job lookup failed:", err);
                return res.status(500).json({ message: "Job lookup failed" });
            }

            const jobs = result.map(job => ({
                job_id: job.job_id,
                order_status: job.order_status,
                lens_status: job.lens_status,
                frame_status: job.frame_status,
                is_claimer: job.is_claimer, // 👈 included
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
                current_page: parsedPage,
                limit: parsedLimit,
                jobs
            });
        });
    });
};

exports.verifyClimJobId = (req, res) => {
    const { verifyId, jobNetPrice } = req.body;

    // Basic validation
    if (!verifyId || !jobNetPrice) {
        return res.status(400).json({
            message: "Job ID and Net Price are required",
        });
    }

    const sql = `
    SELECT 
      job_id,
      is_claimer,
      order_status,
      netPrice,
      due_amount
    FROM job
    WHERE job_id = ?
    LIMIT 1
  `;

    db.query(sql, [verifyId], (err, results) => {
        if (err) {
            console.error("DB error:", err);
            return res.status(500).json({
                message: "Database error while verifying job",
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Job not found",
            });
        }

        const job = results[0];

        /* 1️⃣ is_claimer check */
        if (job.is_claimer !== 0) {
            return res.status(400).json({
                message: "This job can't add to claim because it's already claim active",
            });
        }

        /* 2️⃣ order_status check */
        if (job.order_status === 1) {
            return res.status(400).json({
                message: "Job must be Ready before add to claim",
            });
        }

        if (job.order_status === 3) {
            return res.status(400).json({
                message: "This job is already completed",
            });
        }

        if (job.order_status === 0) {
            return res.status(400).json({
                message: "This job has been canceled",
            });
        }

        // Only order_status === 2 allowed
        if (job.order_status !== 2) {
            return res.status(400).json({
                message: "Invalid job status",
            });
        }

        /* 3️⃣ net price vs payload net price */
        if (Number(job.netPrice) !== Number(jobNetPrice)) {
            return res.status(400).json({
                message: "Net price of claim job does not match",
            });
        }

        /* 4️⃣ net price vs due amount */
        if (Number(job.netPrice) !== Number(job.due_amount)) {
            return res.status(400).json({
                message: "Selected job net price and due amount does not match",
            });
        }

        /* ✅ All checks passed */
        return res.status(200).json({
            job_id: job.job_id,
            net_price: job.netPrice,
            due_amount: job.due_amount,
        });
    });
};

exports.addSelfClaimJob = (req, res) => {
    const { jobId } = req.params;
    const userId = req.user?.user_id;

    if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
    }

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized user" });
    }

    /**
     * STEP 1: Select job and get netPrice
     */
    const selectJobQuery = `
        SELECT netPrice
        FROM job
        WHERE job_id = ?
        LIMIT 1
    `;

    db.query(selectJobQuery, [jobId], (err, jobResult) => {
        if (err) {
            console.error("Select job error:", err);
            return res.status(500).json({ message: "Failed to fetch job" });
        }

        if (jobResult.length === 0) {
            return res.status(404).json({ message: "Job not found" });
        }

        const netPrice = jobResult[0].netPrice;

        /**
         * STEP 2: Create billing record
         */
        const insertBillQuery = `
            INSERT INTO billing (
                job_id,
                amount,
                payment_method,
                bill_type,
                bill_date,
                payment_status,
                is_claimer_bill,
                billed_by
            )
            VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
        `;

        const billValues = [
            jobId,
            netPrice,
            "Cash",
            "Final Payment",
            1,
            1,
            userId
        ];

        db.query(insertBillQuery, billValues, (err, billResult) => {
            if (err) {
                console.error("Insert bill error:", err);
                return res.status(500).json({ message: "Failed to create bill" });
            }

            const billId = billResult.insertId;

            /**
             * STEP 3: Update job is_claimer (1 → 2)
             */
            const updateJobQuery = `
                UPDATE job
                SET is_claimer = 2
                WHERE job_id = ?
            `;

            db.query(updateJobQuery, [jobId], (err) => {
                if (err) {
                    console.error("Update job error:", err);
                    return res.status(500).json({ message: "Failed to update job claimer status" });
                }

                /**
                 * STEP 4: Send response
                 */
                return res.status(200).json({
                    message: "Self claim processed successfully",
                    claimId: jobId,
                    bill_id: billId
                });
            });
        });
    });
};



