const express = require('express');
const router = express.Router();
const crisisService = require('../services/crisis.service');
const authenticateToken = require('../middleware/auth');
const { verifyToken, checkRole } = require('../middleware/rbac');

// Crisis Management
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const crisis = await crisisService.createCrisis(req.body, req.user.userId);
        res.status(201).json(crisis);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/update/:id', authenticateToken, async (req, res) => {
    try {
        const crisis = await crisisService.updateCrisis(req.params.id, req.body, req.user.userId);
        res.json(crisis);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/list', async (req, res) => {
    try {
        const crises = await crisisService.listCrises(req.query);
        res.json(crises);
    } catch (error) {
        console.warn('[Crisis] list failed:', error?.message);
        res.status(200).json([]);
    }
});

router.get('/:id([0-9a-fA-F-]{36})', async (req, res) => {
    try {
        const crisis = await crisisService.getCrisis(req.params.id);
        if (!crisis) return res.status(404).json({ error: "Crisis not found" });
        res.json(crisis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id([0-9a-fA-F-]{36})', authenticateToken, async (req, res) => {
    try {
        await crisisService.deleteCrisis(req.params.id, req.user.userId);
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Updates
router.post('/update-event', authenticateToken, async (req, res) => {
    try {
        const { crisisId, updateText, announcementId } = req.body;
        const update = await crisisService.addUpdate(crisisId, updateText, req.user.userId, announcementId);
        res.status(201).json(update);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:id([0-9a-fA-F-]{36})/updates', async (req, res) => {
    try {
        const crisis = await crisisService.getCrisis(req.params.id);
        res.json(crisis ? crisis.updates : []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Streams
router.post('/stream/add', authenticateToken, async (req, res) => {
    try {
        const { crisisId, streamUrl, platform } = req.body;
        const stream = await crisisService.addStream(crisisId, streamUrl, platform, req.user.userId);
        res.status(201).json(stream);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:id([0-9a-fA-F-]{36})/streams', async (req, res) => {
    try {
        const crisis = await crisisService.getCrisis(req.params.id);
        res.json(crisis ? crisis.streams : []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin dashboard
router.get('/admin/dashboard', verifyToken, checkRole(['Admin', 'CrisisManager', 'Viewer']), async (req, res) => {
    try {
        const data = await crisisService.getDashboardStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/admin/list', verifyToken, checkRole(['Admin', 'CrisisManager', 'Viewer']), async (req, res) => {
    try {
        const data = await crisisService.listCrisesAdmin(req.query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/admin/:id/resolve', verifyToken, checkRole(['Admin', 'CrisisManager']), async (req, res) => {
    try {
        const data = await crisisService.markResolved(req.params.id, req.user.userId);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/admin/:id/increase-severity', verifyToken, checkRole(['Admin', 'CrisisManager']), async (req, res) => {
    try {
        const data = await crisisService.increaseSeverity(req.params.id, req.user.userId);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/admin/:id/announcements', verifyToken, checkRole(['Admin', 'Publisher', 'CrisisManager']), async (req, res) => {
    try {
        const announcementIds = Array.isArray(req.body.announcementIds) ? req.body.announcementIds : [];
        const data = await crisisService.linkAnnouncements(req.params.id, announcementIds, req.user.userId);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.patch('/admin/streams/:id/live', verifyToken, checkRole(['Admin', 'CrisisManager']), async (req, res) => {
    try {
        const { isLive } = req.body;
        const data = await crisisService.toggleStream(req.params.id, !!isLive, req.user.userId);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/logs', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const data = await crisisService.listAuditLogs(req.query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/admin/users', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const data = await crisisService.listUsers(req.query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/admin/users/:id/role', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const data = await crisisService.updateUserRole(req.params.id, req.body.role, req.user.userId);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/admin/users/:id/disable', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const data = await crisisService.disableUser(req.params.id, req.user.userId, !!req.body.disabled);
        res.json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/moderation/reports', verifyToken, checkRole(['Admin']), async (req, res) => {
    try {
        const data = await crisisService.listModerationReports(req.query);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
