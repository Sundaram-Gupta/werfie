const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log(`Auth Middleware: Header: ${authHeader ? 'Present' : 'Missing'}`);

    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        // Check for x-user-id fallback (Gateway might set it in future)
        if (req.headers['x-user-id']) {
            console.log('Auth Middleware: Using x-user-id fallback');
            req.user = { userId: req.headers['x-user-id'], id: req.headers['x-user-id'] };
            return next();
        }
        console.log('Auth Middleware: No token provided');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Auth Middleware: Token verification failed:', err.message);
            return res.status(401).json({ error: 'Unauthorized', details: err.message });
        }
        console.log('Auth Middleware: Success, user:', user.sub);
        req.user = user;
        req.user.userId = user.sub || user.id || user.userId; // Map standard claims
        req.user.id = req.user.userId; // Ensure .id is also available
        next();
    });
};

module.exports = authenticateToken;
