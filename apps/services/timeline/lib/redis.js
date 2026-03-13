// Shared Redis utility
import Redis from 'ioredis'

let redisClient

export function getRedisClient() {
    if (!redisClient) {
        redisClient = new Redis({
            host: process.env.REDIS_HOST || 'redis',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || 'xclone_redis_password',
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000)
                return delay
            },
            maxRetriesPerRequest: 3
        })

        redisClient.on('connect', () => {
            console.log('✅ Redis connected')
        })

        redisClient.on('error', (err) => {
            console.error('❌ Redis error:', err)
        })
    }

    return redisClient
}

// Cache helper
export async function cacheGet(key) {
    const redis = getRedisClient()
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
}

export async function cacheSet(key, value, ttl = 300) {
    const redis = getRedisClient()
    await redis.setex(key, ttl, JSON.stringify(value))
}

export async function cacheDel(key) {
    const redis = getRedisClient()
    await redis.del(key)
}

// Rate limiting
export async function rateLimit(key, limit = 100, window = 60) {
    const redis = getRedisClient()
    const current = await redis.incr(key)

    if (current === 1) {
        await redis.expire(key, window)
    }

    return {
        success: current <= limit,
        remaining: Math.max(0, limit - current),
        resetIn: await redis.ttl(key)
    }
}

// Timeline operations
export async function addToTimeline(userId, postId, score = Date.now()) {
    const redis = getRedisClient()
    const key = `timeline:${userId}`

    // Add to sorted set (score = timestamp for chronological order)
    await redis.zadd(key, score, postId)

    // Keep only last 1000 posts
    await redis.zremrangebyrank(key, 0, -1001)

    // Set expiry (7 days)
    await redis.expire(key, 604800)
}

export async function getTimeline(userId, limit = 20, offset = 0) {
    const redis = getRedisClient()
    const key = `timeline:${userId}`

    // Get posts in reverse chronological order
    const postIds = await redis.zrevrange(key, offset, offset + limit - 1)
    return postIds
}

export async function removeFromTimeline(userId, postId) {
    const redis = getRedisClient()
    const key = `timeline:${userId}`
    await redis.zrem(key, postId)
}
