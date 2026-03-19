const express = require('express');
const router = express.Router();
const highlightsController = require('../controllers/highlightsController');
const authenticateToken = require('../middleware/auth');

/**
 * @route POST /api/highlights/toggle
 * @desc Toggle highlight status of a post
 * @access Private
 */
router.post('/toggle', authenticateToken, highlightsController.toggleHighlight);

/**
 * @route GET /api/highlights/user/:userId
 * @desc Get all highlights for a user
 * @access Public
 */
router.get('/user/:userId', highlightsController.getHighlights);

module.exports = router;
