const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

const isAdmin = async (req, res, next) => {
    // This middleware should run AFTER verifyToken
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const { rows } = await db.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
        if (rows.length > 0 && rows[0].role === 'Admin') {
            next();
        } else {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = { verifyToken, isAdmin };
