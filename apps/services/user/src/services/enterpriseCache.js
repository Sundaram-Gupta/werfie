const Redis = require('ioredis');

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const options = process.env.REDIS_URL ? process.env.REDIS_URL : { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD };
const redisClient = new Redis(options);
redisClient.on('error', (err) => console.error('[Redis] Error', err));

async function getCached(key) {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
}

async function setCached(key, value, ttlSeconds = 60) {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

module.exports = {
    redisClient,
    getCached,
    setCached
};
