const express = require('express');
const router = express.Router();
const soapboxService = require('../services/soapbox.service');
const authenticateToken = require('../middleware/auth');

// Logging for debugging
router.use((req, res, next) => {
    console.log(`[SoapboxRoutes] ${req.method} ${req.path}`);
    next();
});

router.get('/_health', (req, res) => {
    res.json({ status: 'ok', message: 'Soapbox router is active' });
});

/**
 * List all sessions.
 */
router.get('/list', async (req, res) => {
    try {
        const sessions = await soapboxService.listSessions(req.query);
        res.json(sessions);
    } catch (err) {
        console.error('[Soapbox List]', err);
        res.json([]);
    }
});

/**
 * Get session details.
 */
router.get('/:id', async (req, res) => {
    try {
        const session = await soapboxService.getSession(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Create session (Authorized only).
 */
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const session = await soapboxService.createSession(req.body);
        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Start session manually.
 */
router.post('/:id/start', authenticateToken, async (req, res) => {
    try {
        const session = await soapboxService.startSession(req.params.id);
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * End session manually.
 */
router.post('/:id/end', authenticateToken, async (req, res) => {
    try {
        const session = await soapboxService.endSession(req.params.id);
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Add statement to live session.
 */
router.post('/:id/statement', authenticateToken, async (req, res) => {
    try {
        const statement = await soapboxService.addStatement(req.params.id, req.body);
        res.status(201).json(statement);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * Add rebuttal to completed session.
 */
router.post('/:id/rebuttal', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const rebuttal = await soapboxService.addRebuttal(req.params.id, {
            ...req.body,
            userId
        });
        res.status(201).json(rebuttal);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * Get transcript.
 */
router.get('/:id/transcript', async (req, res) => {
    try {
        const session = await soapboxService.getSession(req.params.id);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({
            transcript: session.transcriptText,
            summary: session.aiSummary
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
