// =====================================================
// JWT Authentication & Authorization Middleware
// =====================================================
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * verifyToken - Checks if the request has a valid JWT token
 * Extracts user info (id, role) and attaches it to req.user
 */
const verifyToken = (req, res, next) => {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, email }
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

/**
 * authorizeRoles - Restricts access to specific user roles
 * Usage: authorizeRoles('admin', 'hospital')
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRoles };
