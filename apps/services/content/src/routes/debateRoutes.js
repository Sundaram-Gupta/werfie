const express = require('express');
const router = express.Router();
const debateService = require('../services/debate.service');
const authenticateToken = require('../middleware/auth');

// Check for globally applied auth - removed to allow public list and view endpoints.

/**
 * 1. Session Management
 */

// Create a new debate
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const session = await debateService.createSession(req.body);
        res.status(201).json(session);
    } catch (err) {
        console.error('[Debate API - Create]', err);
        res.status(500).json({ error: 'Failed to create debate session' });
    }
});

// List debates
router.get('/list', async (req, res) => {
    try {
        const filters = req.query || {};
        const sessions = await debateService.listSessions(filters);
        res.status(200).json(sessions);
    } catch (err) {
        console.error('[Debate API - List]', err);
        res.status(200).json([]);
    }
});

// Get a specific debate session
router.get('/:id', async (req, res) => {
    try {
        const session = await debateService.getSessionById(req.params.id);
        if (!session) return res.status(404).json({ status: false, message: 'Session not found', data: null });
        res.status(200).json({ status: true, message: 'Debate fetched successfully', data: session });
    } catch (err) {
        console.error('[Debate API - GetByID]', err);
        res.status(500).json({ status: false, message: 'Failed to fetch session', data: null });
    }
});

// Update standard status (e.g. archiving)
router.put('/update/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const session = await debateService.updateSessionStatus(req.params.id, status);
        res.status(200).json({ status: true, message: 'Debate updated successfully', data: session });
    } catch (err) {
        console.error('[Debate API - Update]', err);
        res.status(500).json({ status: false, message: err.message || 'Failed to update session status', data: null });
    }
});

// PUT /:id - update debate by id (alias for PUT /update/:id)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body || {};
        if (!status) {
            return res.status(400).json({ status: false, message: 'Status is required', data: null });
        }
        const session = await debateService.updateSessionStatus(req.params.id, status);
        res.status(200).json({ status: true, message: 'Debate updated successfully', data: session });
    } catch (err) {
        console.error('[Debate API - UpdateById]', err);
        res.status(500).json({ status: false, message: err.message || 'Failed to update session status', data: null });
    }
});

/**
 * 2. Round Management
 */

router.post('/:id/start-round', authenticateToken, async (req, res) => {
    try {
        const { roundNumber, speakerId } = req.body;
        const round = await debateService.startRound(req.params.id, roundNumber, speakerId);
        res.status(200).json(round);
    } catch (err) {
        console.error('[Debate API - StartRound]', err);
        res.status(400).json({ error: err.message });
    }
});

router.post('/round/:id/end', authenticateToken, async (req, res) => {
    try {
        const round = await debateService.endRound(req.params.id);
        res.status(200).json(round);
    } catch (err) {
        console.error('[Debate API - EndRound]', err);
        res.status(400).json({ error: err.message });
    }
});

router.get('/:id/rounds', async (req, res) => {
    try {
        const rounds = await debateService.getRounds(req.params.id);
        res.status(200).json(rounds);
    } catch (err) {
        console.error('[Debate API - GetRounds]', err);
        res.status(500).json({ error: 'Failed to fetch rounds' });
    }
});

/**
 * 3. Argument Management
 */

router.post('/round/:id/argument', authenticateToken, async (req, res) => {
    try {
        // speakerId from req.user handles auth identity
        const speakerId = req.user.id;
        const { argumentText } = req.body;
        const argument = await debateService.postArgument(req.params.id, speakerId, argumentText);
        res.status(201).json(argument);
    } catch (err) {
        console.error('[Debate API - PostArgument]', err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * 4. Voting Management
 */

router.post('/:id/vote', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { voteChoice } = req.body;

        if (!['participant_a', 'participant_b', 'inconclusive'].includes(voteChoice)) {
            return res.status(400).json({ error: 'Invalid vote choice' });
        }

        const vote = await debateService.submitVote(req.params.id, userId, voteChoice);
        res.status(201).json(vote);
    } catch (err) {
        console.error('[Debate API - SubmitVote]', err);
        res.status(400).json({ error: err.message });
    }
});

router.get('/:id/results', async (req, res) => {
    try {
        const results = await debateService.getResults(req.params.id);
        res.status(200).json(results);
    } catch (err) {
        console.error('[Debate API - GetResults]', err);
        res.status(500).json({ error: 'Failed to fetch voting results' });
    }
});

/**
 * 5. Fact Check Management
 */

router.post('/fact-check', authenticateToken, async (req, res) => {
    try {
        const reviewerId = req.user.id;
        const { argumentId, referenceTitle, referenceUrl, notes, verificationStatus } = req.body;

        const data = { referenceTitle, referenceUrl, notes, verificationStatus };
        const factCheck = await debateService.attachFactCheck(argumentId, reviewerId, data);
        res.status(201).json(factCheck);
    } catch (err) {
        console.error('[Debate API - FactCheck]', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
