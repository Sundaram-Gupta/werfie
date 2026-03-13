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
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        if (req.headers['x-user-id']) {
            req.user = { userId: req.headers['x-user-id'], id: req.headers['x-user-id'] };
            return next();
        }
        return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Auth Middleware: Token verification failed:', err.message);
            return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
        }
        console.log('Auth Middleware: Success, user:', user.sub);
        req.user = user;
        req.user.userId = user.sub || user.id || user.userId; // Map standard claims
        req.user.id = req.user.userId; // Ensure .id is also available
        next();
    });
};

module.exports = authenticateToken;
