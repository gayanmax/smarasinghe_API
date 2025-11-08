const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
require('dotenv').config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Store refresh tokens in memory (optional: use DB or Redis)
let refreshTokens = [];

const generateAccessToken = (user) => {
    return jwt.sign(user, ACCESS_SECRET, { expiresIn: process.env.ACCESS_EXPIRES_IN });
};

const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(user, REFRESH_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });
    refreshTokens.push(refreshToken); // store temporarily
    return refreshToken;
};



exports.register = async (req, res) => {
    const { user_name, email, password, is_admin } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Step 1: Check if email already exists
    const checkSql = 'SELECT * FROM users WHERE email = ?';
    db.query(checkSql, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // ✅ Step 2: If not exists, insert new user
        const insertSql = `
            INSERT INTO users (user_name, email, password, is_admin, last_login_time)
            VALUES (?, ?, ?, ?, NOW())
        `;

        db.query(insertSql, [user_name, email, hashedPassword, is_admin], (err, result) => {
            if (err) return res.status(500).json({ message: 'Registration failed' });
            res.status(201).json({ message: 'User registered successfully' });
        });
    });
};


exports.login = (req, res) => {
    const {user_name, password} = req.body;
    // console.log(email,password)
    db.query('SELECT * FROM users WHERE user_name = ?', [user_name], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({message: 'Invalid credentials'});

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({message: 'Incorrect password'});

        const payload = {user_id: user.user_id, email: user.email,user_name: user.user_name,is_admin:user.is_admin};

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        res.json({accessToken, refreshToken,  user: {
                user_id: user.user_id,
                is_admin: user.is_admin,
                user_name: user.user_name
            }});
    });
};

exports.refreshToken = (req, res) => {
    const {token} = req.body;
    if (!token) return res.status(401).json({message: 'Refresh token required'});
    if (!refreshTokens.includes(token)) return res.status(403).json({message: 'Invalid refresh token'});

    jwt.verify(token, REFRESH_SECRET, (err, user) => {
        if (err) return res.status(403).json({message: 'Token expired or invalid'});

        const payload = {user_id: user.user_id, email: user.email};
        const newAccessToken = generateAccessToken(payload);
        res.json({accessToken: newAccessToken});
    });
};

exports.logout = (req, res) => {
    const {token} = req.body;
    refreshTokens = refreshTokens.filter(t => t !== token);
    res.json({message: 'Logged out successfully'});
};

exports.profile = (req, res) => {
    res.json({ message: 'User profile', user: req.user });
};

// GET /api/users
exports.getAllUsers = (req, res) => {
    // const sql = `SELECT user_id, user_name, email, is_admin, last_login_time, create_date FROM users`;
    const sql = `SELECT * FROM users`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }

        res.status(200).json({
            success: true,
            result,
        });
    });
};
