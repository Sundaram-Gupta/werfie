/**
 * Scheduled Post Publisher - Kafka-driven scheduling
 * Runs every 15s, finds posts where scheduledAt <= now, clears scheduledAt,
 * emits POST_CREATED to Kafka, and broadcasts WebSocket so clients refresh without page reload.
 */
const { PrismaClient } = require('@prisma/client');
const kafkaProducer = require('./kafka');
const websocketService = require('./services/websocket.service');

const prisma = new PrismaClient();
const POLL_INTERVAL_MS = 15_000; // 15 seconds - snappier display at scheduled time

let intervalId = null;

async function publishDueScheduledPosts() {
    try {
        const now = new Date();
        const duePosts = await prisma.post.findMany({
            where: {
                scheduledAt: { not: null, lte: now }
            },
            select: { id: true, userId: true, content: true, createdAt: true }
        });

        if (duePosts.length === 0) return;

        for (const post of duePosts) {
            try {
                await prisma.post.update({
                    where: { id: post.id },
                    data: { scheduledAt: null }
                });

                // Emit Kafka event (non-blocking - don't let Kafka failure prevent real-time UI update)
                kafkaProducer.send('POST_CREATED', {
                    id: post.id,
                    userId: post.userId,
                    content: post.content,
                    mediaCount: 0,
                    createdAt: post.createdAt
                }).catch(kafkaErr => {
                    console.warn('[ScheduledPostPublisher] Kafka send failed (feed will still update):', kafkaErr?.message || kafkaErr);
                });

                // Always broadcast so clients see the post without refresh
                websocketService.broadcastFeedUpdate();
                console.log(`[ScheduledPostPublisher] Published scheduled post ${post.id}`);
            } catch (postErr) {
                console.error(`[ScheduledPostPublisher] Failed to publish post ${post.id}:`, postErr?.message || postErr);
            }
        }
    } catch (err) {
        // Handle missing scheduledAt column or other schema issues gracefully
        if (err?.meta?.column === 'scheduledAt' || err?.message?.includes('scheduledAt')) {
            console.warn('[ScheduledPostPublisher] Post.scheduledAt column missing - run: ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);');
        } else {
            console.error('[ScheduledPostPublisher] Error:', err?.message || err);
        }
    }
}

function startScheduledPostPublisher() {
    if (intervalId) return;
    console.log('[ScheduledPostPublisher] Starting (poll every 15s, Kafka + WebSocket broadcast)');
    publishDueScheduledPosts(); // Run immediately on startup
    intervalId = setInterval(publishDueScheduledPosts, POLL_INTERVAL_MS);
}

function stopScheduledPostPublisher() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[ScheduledPostPublisher] Stopped');
    }
}

module.exports = {
    startScheduledPostPublisher,
    stopScheduledPostPublisher,
    publishDueScheduledPosts
};
