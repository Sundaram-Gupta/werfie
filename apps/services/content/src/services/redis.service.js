const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let client = null;
let pub = null;
let sub = null;
let ready = false;

const baseOptions = REDIS_URL ? REDIS_URL : { host: REDIS_HOST, port: REDIS_PORT, password: REDIS_PASSWORD };

async function init() {
    if (client) return;
    try {
        client = new Redis(baseOptions);
        pub = new Redis(baseOptions);
        sub = new Redis(baseOptions);
        await Promise.all([client.ping(), pub.ping(), sub.ping()]);
        ready = true;
        console.log('[Redis] Connected');
    } catch (error) {
        ready = false;
        console.warn('[Redis] Unavailable, falling back to in-memory behavior:', error.message);
    }
}

function isReady() {
    return ready;
}

async function getJSON(key) {
    if (!ready) return null;
    const raw = await client.get(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

async function setJSON(key, value, ttlSeconds = 15) {
    if (!ready) return;
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

async function deleteByPrefix(prefix) {
    if (!ready) return 0;
    let cursor = '0';
    let deleted = 0;
    do {
        const [next, keys] = await client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;
        if (keys.length > 0) {
            deleted += await client.del(...keys);
        }
    } while (cursor !== '0');
    return deleted;
}

async function publish(channel, payload) {
    if (!ready) return;
    await pub.publish(channel, JSON.stringify(payload));
}

async function subscribe(channel, onMessage) {
    if (!ready) return;
    await sub.subscribe(channel);
    sub.on('message', (ch, raw) => {
        if (ch !== channel) return;
        try {
            onMessage(JSON.parse(raw));
        } catch {
            // ignore invalid payload
        }
    });
}

module.exports = {
    init,
    isReady,
    getJSON,
    setJSON,
    deleteByPrefix,
    publish,
    subscribe
};
