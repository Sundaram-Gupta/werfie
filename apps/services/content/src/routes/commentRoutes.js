const express = require('express');
const router = express.Router();
const commentService = require('../services/comment.service');
const authenticateToken = require('../middleware/auth');
// Note: We'd normally use a dedicated isAdmin/isModerator middleware for the moderation routes.

// ==========================================
// 1. PUBLIC / USER ROUTES
// ==========================================

// Create a new comment (protected by auth & verification in service)
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { announcementId, content, parentCommentId } = req.body;
        const userId = req.user.userId || req.user.id;
        const token = req.headers.authorization;

        const comment = await commentService.createComment(announcementId, userId, content, token, parentCommentId);
        res.status(201).json({ message: "Comment submitted for moderation", comment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get approved comments for an announcement
router.get('/:announcementId', async (req, res) => {
    try {
        const comments = await commentService.getApprovedComments(req.params.announcementId);
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Report a comment
router.post('/report', authenticateToken, async (req, res) => {
    try {
        const { commentId, reason } = req.body;
        const userId = req.user.userId || req.user.id;
        const report = await commentService.reportComment(commentId, userId, reason);
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 2. MODERATION ROUTES (Admin/Mod Only logic)
// ==========================================

// Get moderation queue
router.get('/moderation/queue', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query; // pending, approved, rejected
        const queue = await commentService.getModerationQueue(status || 'pending');
        res.status(200).json(queue);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve a comment in queue
router.post('/moderation/approve/:queueId', authenticateToken, async (req, res) => {
    try {
        const adminId = req.user.userId || req.user.id;
        const result = await commentService.moderateComment(req.params.queueId, adminId, 'approved', req.body.notes);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Reject a comment in queue
router.post('/moderation/reject/:queueId', authenticateToken, async (req, res) => {
    try {
        const adminId = req.user.userId || req.user.id;
        const result = await commentService.moderateComment(req.params.queueId, adminId, 'rejected', req.body.notes);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Set Fact-Flag
router.post('/moderation/fact-flag/:commentId', authenticateToken, async (req, res) => {
    try {
        const { flag } = req.body; // boolean
        const result = await commentService.toggleFactFlag(req.params.commentId, flag);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
