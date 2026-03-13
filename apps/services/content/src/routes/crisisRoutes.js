const express = require('express');
const router = express.Router();
const crisisService = require('../services/crisis.service');
const authenticateToken = require('../middleware/auth');

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

router.get('/:id', async (req, res) => {
    try {
        const crisis = await crisisService.getCrisis(req.params.id);
        if (!crisis) return res.status(404).json({ error: "Crisis not found" });
        res.json(crisis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await crisisService.deleteCrisis(req.params.id);
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

router.get('/:id/updates', async (req, res) => {
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
        const stream = await crisisService.addStream(crisisId, streamUrl, platform);
        res.status(201).json(stream);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:id/streams', async (req, res) => {
    try {
        const crisis = await crisisService.getCrisis(req.params.id);
        res.json(crisis ? crisis.streams : []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
