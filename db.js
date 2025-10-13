const mysql = require('mysql2');
require('dotenv').config();

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'soptc'
// });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'admingayan',
    password: '@61823fHukloDusf66#',
    database: 'soptc'
});

db.connect(err => {
    if (err) throw err;
    console.log('✅ Connected to MySQL');
});


module.exports = db;
