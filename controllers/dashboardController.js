const db = require('../db');

exports.getDashboardData = (req, res) => {

    // 1. Get daily customer count
    const dailyCustomerQuery = `
        SELECT COUNT(*) AS count
        FROM customers
        WHERE DATE(create_date) = CURDATE()
    `;

    db.query(dailyCustomerQuery, (err, dailyCustomerResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        // 2. Get daily job count
        const dailyJobQuery = `
            SELECT COUNT(*) AS count
            FROM job
            WHERE DATE(create_date) = CURDATE()
        `;

        db.query(dailyJobQuery, (err, dailyJobResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Server error" });
            }

            // 3. Get pending jobs count
            const pendingQuery = `
                SELECT COUNT(*) AS count
                FROM job
                WHERE order_status = 1
            `;

            db.query(pendingQuery, (err, pendingResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: "Server error" });
                }

                // 4. Get ready jobs count
                const readyQuery = `
                    SELECT COUNT(*) AS count
                    FROM job
                    WHERE order_status = 2
                `;

                db.query(readyQuery, (err, readyResult) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ success: false, message: "Server error" });
                    }

                    // ------ Final Response ------
                    const data = {
                        dailyCustomers: dailyCustomerResult[0].count,
                        dailyJobs: dailyJobResult[0].count,
                        pendingJobs: pendingResult[0].count,
                        readyJobs: readyResult[0].count
                    };

                    return res.status(200).json({ success: true, data });
                });
            });
        });
    });
};
