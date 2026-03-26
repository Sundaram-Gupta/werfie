const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const authenticateToken = (req, res, next) => {
    // Trust gateway-injected identity when gateway has already verified the JWT
    if (req.headers['x-verified-gateway'] === 'true' && req.headers['x-user-id']) {
        req.user = {
            userId: req.headers['x-user-id'],
            id: req.headers['x-user-id'],
            email: req.headers['x-user-email'] || ''
        };
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
        if (req.headers['x-user-id']) {
            req.user = { userId: req.headers['x-user-id'], id: req.headers['x-user-id'] };
            return next();
        }
        console.warn(`Auth Middleware: No token found for ${req.url}`);
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error(`Auth Middleware: Token verification failed for ${req.url}:`, err.message);
            return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
        }
        console.log(`Auth Middleware: Success for ${req.url}, user:`, user.sub || user.id);
        req.user = user;
        req.user.userId = user.sub || user.id || user.userId;
        req.user.id = req.user.userId;
        next();
    });
};

// Optional auth: set req.user when token present, but never return 401 (for public GET /api/posts)
const optionalAuthenticateToken = (req, res, next) => {
    if (req.headers['x-verified-gateway'] === 'true' && req.headers['x-user-id']) {
        req.user = {
            userId: req.headers['x-user-id'],
            id: req.headers['x-user-id'],
            email: req.headers['x-user-email'] || ''
        };
        return next();
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        if (req.headers['x-user-id']) {
            req.user = { userId: req.headers['x-user-id'], id: req.headers['x-user-id'] };
        } else {
            req.user = null;
        }
        return next();
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
            return next();
        }
        req.user = { ...user, userId: user.sub || user.id || user.userId, id: user.sub || user.id || user.userId };
        next();
    });
};

module.exports = authenticateToken;
module.exports.optionalAuthenticateToken = optionalAuthenticateToken;
