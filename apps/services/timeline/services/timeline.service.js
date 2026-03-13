import { PrismaClient } from '@prisma/client'
import { addToTimeline, getTimeline } from '../lib/redis.js'

const prisma = new PrismaClient()

export class TimelineService {
    /**
     * Fan-out a new post to all followers' timelines
     * @param {string} postId 
     * @param {string} userId 
     */
    static async fanOutPost(postId, userId) {
        try {
            console.log(`🚀 Starting fan-out for post ${postId} by user ${userId}`)

            // 1. Get all followers
            // In a real production system with millions of followers, this would be batched
            const followers = await prisma.follow.findMany({
                where: { followingId: userId },
                select: { followerId: true }
            })

            console.log(`👥 Found ${followers.length} followers`)

            // 2. Add to each follower's timeline in Redis
            // Pipeline these operations for performance
            const promises = followers.map(follow =>
                addToTimeline(follow.followerId, postId)
            )

            await Promise.all(promises)

            // 3. Add to author's own timeline
            await addToTimeline(userId, postId)

            console.log(`✅ Fan-out complete for ${followers.length + 1} timelines`)
        } catch (error) {
            console.error('❌ Fan-out error:', error)
            throw error
        }
    }

    /**
     * Generate or retrieve home timeline for a user
     * @param {string} userId 
     * @param {number} limit 
     * @param {number} offset 
     */
    static async getHomeTimeline(userId, limit = 20, offset = 0) {
        try {
            // 1. Try to get from Redis Cache first
            const cachedPostIds = await getTimeline(userId, limit, offset)

            let postIds = cachedPostIds

            // 2. If Cache Miss (or empty), warm up from DB
            // This happens if Redis data expired or user is new
            if (postIds.length === 0 && offset === 0) {
                console.log(`Data fetch: Cache miss for user ${userId}, warming up from DB`)
                postIds = await this.warmupTimeline(userId)
            }

            if (postIds.length === 0) {
                return []
            }

            // 3. Hydrate posts (fetch full details from DB)
            // We only fetch the posts requested for this page
            const posts = await prisma.post.findMany({
                where: {
                    id: { in: postIds }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                // In a full implementation, we'd include user, likes, etc.
                // For now, we rely on the client or Content service to fetch details, 
                // OR we fetch basic details here. Let's fetch basic details to return a usable feed.
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    userId: true,
                    // We could ideally join with User table here too
                }
            })

            // Sort posts to match the order in postIds (Redis order is correct)
            const postMap = new Map(posts.map(p => [p.id, p]))
            const orderedPosts = postIds
                .map(id => postMap.get(id))
                .filter(p => p !== undefined)

            return orderedPosts
        } catch (error) {
            console.error('❌ Get timeline error:', error)
            throw error
        }
    }

    /**
     * Warm up timeline from DB for a user (Fallback)
     */
    static async warmupTimeline(userId) {
        // Get who the user follows
        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        })

        const followingIds = following.map(f => f.followingId)
        followingIds.push(userId) // Include self

        // Get latest posts from these users
        const posts = await prisma.post.findMany({
            where: {
                userId: { in: followingIds }
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { id: true, createdAt: true }
        })

        // Store in Redis
        const promises = posts.map(post =>
            addToTimeline(userId, post.id, new Date(post.createdAt).getTime())
        )
        await Promise.all(promises)

        return posts.map(p => p.id)
    }
}
