const db = require('../db');

// Helper: convert db.query → Promise
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};


// --------------------------------------------------------------
// MAIN SEARCH FUNCTION
// --------------------------------------------------------------
exports.idSearch = async (req, res) => {
    const { type, id } = req.body;

    if (!type || !id) {
        return res.status(400).json({
            success: false,
            message: "Type and ID are required."
        });
    }

    try {
        let jobId;

        // ----------------------------------------------------------
        // TYPE 1 → BILL SEARCH → get job_id first
        // ----------------------------------------------------------
        if (type === "1") {
            const rows = await query(
                "SELECT job_id FROM billing WHERE bill_id = ? LIMIT 1",
                [id]
            );

            if (!rows.length) {
                return res.status(404).json({ success: false, message: "Bill not found" });
            }

            jobId = rows[0].job_id;
        }

            // ----------------------------------------------------------
            // TYPE 2 → JOB SEARCH
        // ----------------------------------------------------------
        else if (type === "2") {
            jobId = id;
        }

        // Invalid type
        else {
            return res.status(400).json({
                success: false,
                message: "Invalid type. Use 1 for bill, 2 for job."
            });
        }

        // ----------------------------------------------------------
        // 1️⃣ FETCH JOB DETAILS
        // ----------------------------------------------------------
        const jobRows = await query("SELECT * FROM job WHERE job_id = ? LIMIT 1", [jobId]);

        if (!jobRows.length) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        const job = jobRows[0];

        // ----------------------------------------------------------
        // 2️⃣ FETCH BILLINGS FOR THIS JOB
        // ----------------------------------------------------------
        const billingRows = await query(
            "SELECT bill_id, amount, bill_type, payment_method, bill_date, billed_by FROM billing WHERE job_id = ? ORDER BY bill_date ASC",
            [jobId]
        );

        const totalPaid = billingRows.reduce((sum, r) => sum + (r.amount || 0), 0);
        const dueAmount = job.netPrice - totalPaid;

        // ----------------------------------------------------------
        // 3️⃣ FRAME DETAILS
        // ----------------------------------------------------------
        let frameData = "frame does not exist";

        if (job.frame_id) {
            const frameRows = await query(
                "SELECT frame_id FROM frame WHERE id = ?",
                [job.frame_id]
            );

            if (frameRows.length) {
                frameData = frameRows[0].frame_id;
            }
        }

        // ----------------------------------------------------------
        // 4️⃣ PRESCRIBED BY DETAILS
        // ----------------------------------------------------------
        let prescribedData = "prescriber does not exist";

        if (job.prescribed_By_Id) {
            const presRows = await query(
                `SELECT prescribed_By_name FROM prescribedby WHERE prescribed_By_id = ?`,
                [job.prescribed_By_Id]
            );

            if (presRows.length) {
                prescribedData = presRows[0].prescribed_By_name;
            }
        }

        // ----------------------------------------------------------
        // 5️⃣ LENS DETAILS (full breakdown)
        // ----------------------------------------------------------
        let lensFull = "lens details not available";

        if (job.lens_id) {
            const lensRows = await query(
                "SELECT * FROM lens WHERE lens_id = ?",
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

        // ----------------------------------------------------------
        // 6️⃣ RETURN FINAL FULL DATASET
        // ----------------------------------------------------------
        return res.json({
            success: true,

            job_id: job.job_id,
            cus_id: job.cus_id,

            // ------------ EYE VALUES ------------
            r_sph: job.r_sph, r_cyl: job.r_cyl, r_axis: job.r_axis,
            r_va: job.r_va, r_iol: job.r_iol, r_add: job.r_add,

            l_sph: job.l_sph, l_cyl: job.l_cyl, l_axis: job.l_axis,
            l_va: job.l_va, l_iol: job.l_iol, l_add: job.l_add,

            // ------------ STATUS + META ------------
            lens_status: job.lens_status,
            frame_status: job.frame_status,
            pupil_distance: job.pupil_distance,
            seg_h: job.seg_h,
            comment: job.comment,
            due_date: job.due_date,
            order_status: job.order_status,
            create_date: job.create_date,

            // ------------ FRAME + PRESCRIBER ------------
            frame: frameData,
            prescribed: prescribedData,

            // ------------ CLAIMER ------------
            claimer:{
                claim_id: job.claim_id,
                claim_status: job.claim_status,
                claim_fprice: job.claim_fprice,
                claim_lprice: job.claim_lprice,
                claim_date: job.claim_date,
            },

            // ------------ PRICING ------------
            pricing: {
                frame_price: job.frame_price,
                lense_price: job.lense_price,
                price: job.price,
                discount: job.discount,
                total_price: job.netPrice,
                total_paid: totalPaid,
                due_amount: job.due_amount,
            },

            // ------------ LENS FULL ------------
            lens: lensFull,

            // ------------ BILLING ------------
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
        console.error("Error in idSearch:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
