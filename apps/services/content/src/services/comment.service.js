const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

class CommentService {

    /**
     * Helper to verify if user is allowed to comment
     * Requires: Authenticated & Verified (Institutional or Personal Verification)
     */
    async _checkUserVerification(userId, token) {
        try {
            // Ideally call user-service profile to check verified status.
            // Using a direct intercept or assuming token has it in a real scenario.
            // For now, let's fetch profile:
            const response = await axios.get(`${USER_SERVICE_URL}/api/users/profile/${userId}`, {
                headers: { Authorization: token }
            });
            const user = response.data;

            // Check verification logic
            const isVerified = user.profile?.verified || user.institutionalProfile?.isVerified;
            return isVerified;
        } catch (error) {
            console.error("Verification check failed:", error.message);
            return false;
        }
    }

    /**
     * Create a comment on an announcement
     * Enforces Info-Lock Window & Verification
     */
    async createComment(announcementId, userId, content, token, parentCommentId = null) {
        // 1. Fetch Announcement to check Info-Lock
        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId }
        });

        if (!announcement) throw new Error("Announcement not found");

        if (announcement.status !== 'published') {
            throw new Error("Cannot comment on unpublished announcements");
        }

        // Check Info-Lock Window
        const effectiveDate = new Date(announcement.effectiveDate);
        const lockDurationMs = announcement.lockDurationMinutes * 60 * 1000;
        const expiryDate = new Date(effectiveDate.getTime() + lockDurationMs);
        const now = new Date();

        if (now < expiryDate) {
            throw new Error(`Info-lock window active. Comments unlock at ${expiryDate.toISOString()}`);
        }

        // 2. Check User Verification
        const isVerified = await this._checkUserVerification(userId, token);
        if (!isVerified) {
            throw new Error("Only verified users can participate in structured discussions.");
        }

        // 3. Optional: Check Thread Depth (Max 3)
        if (parentCommentId) {
            let depth = 1;
            let currentParent = await prisma.structuredComment.findUnique({ where: { id: parentCommentId } });
            while (currentParent && currentParent.parentCommentId) {
                depth++;
                currentParent = await prisma.structuredComment.findUnique({ where: { id: currentParent.parentCommentId } });
                if (depth >= 3) {
                    throw new Error("Maximum thread depth (3) reached.");
                }
            }
        }

        // 4. Create Comment (Default Moderation Status: Pending)
        const comment = await prisma.structuredComment.create({
            data: {
                announcementId,
                userId,
                parentCommentId,
                content,
                moderationStatus: 'pending' // strict moderation rule
            }
        });

        // 5. Add to Moderation Queue
        await prisma.commentModerationQueue.create({
            data: {
                commentId: comment.id,
                reviewStatus: 'pending'
            }
        });

        return comment;
    }

    /**
     * Fetch all approved comments for an announcement (Nested structure)
     */
    async getApprovedComments(announcementId) {
        // Fetch all approved comments for this announcement
        const comments = await prisma.structuredComment.findMany({
            where: {
                announcementId,
                moderationStatus: 'approved'
            },
            orderBy: {
                createdAt: 'asc' // chronological
            }
        });

        // Build Nested Tree (Depth=3 enforcement implicitly handled by create limitation)
        const commentMap = {};
        const roots = [];

        // Initialize map and inject user metadata placeholders if needed
        comments.forEach(c => {
            commentMap[c.id] = { ...c, replies: [] };
        });

        comments.forEach(c => {
            if (c.parentCommentId && commentMap[c.parentCommentId]) {
                commentMap[c.parentCommentId].replies.push(commentMap[c.id]);
            } else {
                roots.push(commentMap[c.id]);
            }
        });

        // Note: For a production app, we would hydrate the `userId` with user details (name, avatar, verification badge)
        // by batch querying the user-service. We'll leave that mapping to the controller or frontend integration if needed.

        return roots;
    }

    /**
     * Moderate a comment (Approve/Reject)
     */
    async moderateComment(queueId, adminId, action, notes = "") {
        if (!['approved', 'rejected'].includes(action)) {
            throw new Error("Action must be 'approved' or 'rejected'");
        }

        const queueItem = await prisma.commentModerationQueue.findUnique({
            where: { id: queueId }
        });

        if (!queueItem) throw new Error("Moderation queue item not found");

        // 1. Update Queue
        await prisma.commentModerationQueue.update({
            where: { id: queueId },
            data: {
                reviewStatus: action,
                reviewerId: adminId,
                notes: notes,
                reviewedAt: new Date()
            }
        });

        // 2. Update Actual Comment Status
        const updatedComment = await prisma.structuredComment.update({
            where: { id: queueItem.commentId },
            data: {
                moderationStatus: action
            }
        });

        // TODO: Fire notification to the author that comment was approved/rejected.

        return updatedComment;
    }

    /**
     * Flag a comment as "Fact-Checked"
     */
    async toggleFactFlag(commentId, flag) {
        return prisma.structuredComment.update({
            where: { id: commentId },
            data: { factFlag: flag }
        });
    }

    /**
     * Fetch Moderation Queue Items
     */
    async getModerationQueue(status = 'pending') {
        return prisma.commentModerationQueue.findMany({
            where: { reviewStatus: status },
            include: {
                comment: {
                    include: {
                        announcement: { select: { title: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Report a comment
     */
    async reportComment(commentId, reporterId, reason) {
        return prisma.commentReport.create({
            data: {
                commentId,
                reporterId,
                reason
            }
        });
    }
}

module.exports = new CommentService();
