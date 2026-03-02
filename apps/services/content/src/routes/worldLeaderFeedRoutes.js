const express = require('express');
const router = express.Router();
const worldLeaderFeedController = require('../controllers/worldLeaderFeed.controller');
const authenticateToken = require('../middleware/auth'); // Optional if public

router.get('/world-leaders', worldLeaderFeedController.getWorldLeadersFeed);
router.get('/leaders/:id/posts', worldLeaderFeedController.getLeaderPosts);

module.exports = router;
