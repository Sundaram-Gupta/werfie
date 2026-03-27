const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const normalizeRole = (role) => {
    if (!role) return '';
    const raw = String(role).trim().toUpperCase();
    if (raw === 'ADMIN') return 'Admin';
    if (raw === 'CRISIS_MANAGER' || raw === 'CRISISMANAGER') return 'CrisisManager';
    if (raw === 'PUBLISHER') return 'Publisher';
    if (raw === 'VIEWER') return 'Viewer';
    return role;
};

const verifyToken = (req, res, next) => {
    if (req.headers['x-verified-gateway'] === 'true' && req.headers['x-user-id']) {
        req.user = {
            userId: req.headers['x-user-id'],
            id: req.headers['x-user-id'],
            email: req.headers['x-user-email'] || '',
            role: normalizeRole(req.headers['x-user-role'] || req.headers['x-role'] || 'Viewer')
        };
        return next();
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader && /^Bearer\s+(.+)$/i.test(authHeader) ? authHeader.replace(/^Bearer\s+/i, '') : null;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = {
            ...payload,
            userId: payload.sub || payload.id || payload.userId,
            id: payload.sub || payload.id || payload.userId,
            role: normalizeRole(payload.role || 'Viewer')
        };
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

const checkRole = (roles = []) => (req, res, next) => {
    const currentRole = normalizeRole(req.user?.role);
    if (!roles.includes(currentRole)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
};

module.exports = {
    verifyToken,
    checkRole
};
