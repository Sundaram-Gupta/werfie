const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const authenticateToken = (req, res, next) => {
    // Trust gateway-injected identity when gateway has already verified the JWT
    const hasVerifiedGateway = req.headers['x-verified-gateway'] === 'true';
    const hasUserId = !!req.headers['x-user-id'];

    if (hasVerifiedGateway && hasUserId) {
        req.user = {
            userId: req.headers['x-user-id'],
            id: req.headers['x-user-id'],
            email: req.headers['x-user-email'] || ''
        };
        console.log(`[User Service Auth] Trusting Gateway Identity: ${req.user.userId}`);
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[User Service Auth] Auth Attempt - x-verified-gateway: ${hasVerifiedGateway}, x-user-id: ${hasUserId}, HasToken: ${!!token}`);

    if (!token) {
        if (req.headers['x-user-id']) {
            console.log(`[User Service Auth] Fulfilling with x-user-id only fallback: ${req.headers['x-user-id']}`);
            req.user = { userId: req.headers['x-user-id'], id: req.headers['x-user-id'] };
            return next();
        }
        console.log('[User Service Auth] Unauthorized: No token and no gateway identity');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Auth Middleware: Token verification failed:', err.message);
            return res.status(401).json({ error: 'Unauthorized', details: err.message });
        }
        req.user = user;
        req.user.userId = user.sub || user.id || user.userId;
        req.user.id = req.user.userId;
        next();
    });
};

module.exports = authenticateToken;
