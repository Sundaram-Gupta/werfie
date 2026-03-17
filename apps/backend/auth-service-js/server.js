require('dotenv').config();
const express = require('express');
const next = require('next');
const http = require('http');
const httpProxy = require('http-proxy');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;
// Bind to 0.0.0.0 so gateway (and Swagger) are reachable on WiFi IP (e.g. http://192.168.1.101:3001)
const bindHost = process.env.HOST || process.env.BIND_HOST || '0.0.0.0';

// Service targets - use env vars for flexibility, fallback to defaults (no trailing slash)
const USER_SERVICE_TARGET = (process.env.USER_SERVICE_URL || `http://127.0.0.1:${process.env.USER_SERVICE_PORT || 3002}`).replace(/\/+$/, '');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true
});

// Error handling for proxy
proxy.on('error', (err, req, res) => {
    console.error(`[Gateway] Proxy Error [${req.url}]:`, err.message);
    if (res && res.writeHead && !res.headersSent) {
        const isConnRefused = err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
        const status = isConnRefused ? 503 : 502;
        const hint = isConnRefused && req.url?.includes('creator-studio')
            ? ' Run: pm2 start ecosystem.config.js --only analytics-service'
            : '';
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: false,
            error: isConnRefused ? 'Service unavailable' : 'Proxy error',
            message: err.message + hint,
            path: req.url
        }));
    }
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
    // Explicitly forward Authorization so downstream services receive it
    const auth = req.headers.authorization || req.headers.Authorization;
    if (auth) proxyReq.setHeader('Authorization', auth);
    if (req._gatewayUser) {
        proxyReq.setHeader('x-verified-gateway', 'true');
        proxyReq.setHeader('x-user-id', String(req._gatewayUser.userId));
        proxyReq.setHeader('x-user-email', req._gatewayUser.email || '');
    }
    const target = typeof options.target === 'string' ? options.target : (options.target?.href || '[Object Target]');
    console.log(`[Gateway] Proxying ${req.method} ${req.url} -> ${target}${proxyReq.path}`);
});

let isAppPrepared = false;

console.log('[Gateway] Starting Express server...');

const mainServer = express();
const httpServer = http.createServer(mainServer);

// Global CORS Middleware - in dev, allow all origins to avoid CORS issues from other devices / tools
function corsOrigin(origin, cb) {
    // For local development we accept any origin so login/signup works from other desktops and tools.
    // If you harden this for production, restrict to specific domains.
    cb(null, true);
}

mainServer.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-User-Id', 'X-Api-Version', 'X-CSRF-Token']
}));

// We removed the global express.json() middleware because it consumes the body stream,
// which causes http-proxy to hang on JSON POST requests. Next.js API routes and proxied
// requests both require the raw stream to remain intact.


// Health check - always 200 when gateway is up (before proxy/catch-all)
mainServer.get('/api/health', (req, res) => {
    res.status(200).json({ status: true, message: 'Gateway healthy', data: { service: 'gateway', timestamp: new Date().toISOString() } });
});

// Werfie AI proxy - avoids CORS by calling AI Worker from server
const AI_WORKER_URL = process.env.AI_WORKER_URL || process.env.VITE_AI_WORKER_URL || 'https://ai-worker.mohit-sharma-150.workers.dev';
const AI_WORKER_API_KEY = process.env.AI_WORKER_API_KEY || process.env.VITE_AI_WORKER_API_KEY || '';
mainServer.post('/api/ai/chat', express.json(), async (req, res) => {
    if (!AI_WORKER_API_KEY) {
        return res.status(500).json({ status: false, message: 'AI is not configured', data: null });
    }
    const text = req.body?.text || '';
    if (!text) {
        return res.status(400).json({ status: false, message: 'Missing text', data: null });
    }
    try {
        const r = await fetch(AI_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': AI_WORKER_API_KEY,
            },
            body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
        });
        if (!r.ok) {
            const err = await r.text();
            return res.status(502).json({ status: false, message: err || 'AI request failed', data: null });
        }
        const data = await r.json();
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
        res.json({ status: true, message: 'Success', data: { text: result } });
    } catch (e) {
        console.error('[Gateway] AI proxy error:', e);
        res.status(502).json({ status: false, message: e?.message || 'Failed to reach AI service', data: null });
    }
});

// Logging middleware
mainServer.use((req, res, next) => {
    if (req.url && !req.url.startsWith('/_next')) {
        console.log(`[Gateway] ${req.method} ${req.url}`);
    }
    next();
});

// Swagger API Docs
const swaggerPath = path.join(__dirname, '..', '..', '..', 'swagger.yaml');
if (fs.existsSync(swaggerPath)) {
    mainServer.get('/api-docs/spec', (req, res) => {
        res.setHeader('Content-Type', 'application/x-yaml');
        res.send(fs.readFileSync(swaggerPath, 'utf8'));
    });
    mainServer.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
        swaggerOptions: {
            url: '/api-docs/spec',
            persistAuthorization: true,
            displayRequestDuration: true,
            tryItOutEnabled: true,
            filter: true,
            persistAuth: true
        },
        customSiteTitle: 'Werfie API | Click Authorize after login to fix 401'
    }));
    console.log('[Gateway] Swagger UI at http://localhost:' + port + '/api-docs');
} else {
    console.warn('[Gateway] swagger.yaml not found at', swaggerPath);
}

// 1. Messaging Service Proxy (WS + REST) - verify JWT at gateway and inject x-user-id for downstream
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Helper: verify JWT and attach gateway user so proxyReq can set headers (http-proxy may not forward modified req.headers)
function injectUserFromToken(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim().replace(/\s+/g, ' ');
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.sub || decoded.userId || decoded.id;
            if (userId) {
                req._gatewayUser = { userId: String(userId), email: decoded.email || '' };
                req.headers['x-verified-gateway'] = 'true';
                req.headers['x-user-id'] = String(userId);
                req.headers['x-user-email'] = (decoded.email || '').toString();
            }
        } catch (e) {
            // Verification failed - downstream may return 401
        }
    }
}

mainServer.all('/api/messages*', (req, res, next) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3019' });
});

// 2. Content Service Proxy – verify JWT at gateway and inject x-user-id for posts, etc.
mainServer.all('/api/posts*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/explore*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
// Trends: spike-based hashtags from content service (not Next.js Trend table)
mainServer.all('/api/trends*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/communities*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/spaces*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/lists*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/ads*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/announcements*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/comments*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/ws/live*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/soapbox*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/crisis*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/debate*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/feed*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/enterprise*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/media*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
// Static media (uploads) - content service serves /uploads
mainServer.all('/uploads*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

// User Service Proxy – verify JWT at gateway so user-service can trust x-user-id
mainServer.all('/api/users*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: USER_SERVICE_TARGET });
});

mainServer.all('/api/business*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: USER_SERVICE_TARGET });
});

mainServer.all('/api/institutional*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: USER_SERVICE_TARGET });
});

mainServer.all('/api/leaders*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: USER_SERVICE_TARGET });
});

// Notifications (content service) – verify JWT and inject x-user-id
mainServer.all('/api/notifications*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

// Timeline (content service) – verify JWT and inject x-user-id for /api/timeline/home etc.
mainServer.all('/api/timeline*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

// Admin Backend Proxy (admin-backend runs on 3012)
mainServer.all('/api/admin*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3012' });
});
mainServer.all('/api/docs*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3012' });
});

// Creator Studio & Analytics (port 3009) - same service
mainServer.all('/api/creator-studio*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3009' });
});

// Monetization (port 3014) - requires auth for stats/profile/tiers
mainServer.all('/api/monetization*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3014' });
});

// Settings (user service) - DB-backed per-user settings, requires auth
mainServer.all('/api/settings*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: USER_SERVICE_TARGET });
});

// 4a. Socket.io /ws/* (polling + upgrade) - proxy to content service for live feeds
mainServer.all('/ws*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

// 4. Other Microservices Catch-all (monetization, settings have explicit routes above)
const microservices = [
    { path: '/api/search', port: 3006 },
    { path: '/api/analytics', port: 3009 },
    { path: '/api/moderation', port: 3010 },
];

microservices.forEach(svc => {
    mainServer.all(`${svc.path}*`, (req, res) => {
        proxy.web(req, res, { target: `http://127.0.0.1:${svc.port}` });
    });
});

// 5. Auth / Local Routes (Next.js)
mainServer.all('*', (req, res) => {
    if (!isAppPrepared) {
        if (req.url.startsWith('/api/')) {
            return res.status(503).json({ 
                error: 'Gateway warming up', 
                message: 'Next.js is still preparing backend routes. Please retry in 10-20 seconds.' 
            });
        }
        return res.status(503).send('Next.js is still preparing. Please wait 10-20 seconds and refresh.');
    }
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
});

// 6. WebSocket Upgrade Handling
httpServer.on('upgrade', (req, socket, head) => {
    try {
        const url = req.url || '';
        const parsedUrl = parse(url);
        const pathname = parsedUrl.pathname || '';
        console.log(`[Gateway] Upgrade request: ${pathname}`);

        if (pathname.startsWith('/api/messages/ws')) {
            console.log('[Gateway] Proxying WebSocket to Messaging Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3019' });
        } else if (pathname.startsWith('/ws/live')) {
            console.log('[Gateway] Proxying WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/soapbox-live')) {
            console.log('[Gateway] Proxying Soapbox WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/debate-live')) {
            console.log('[Gateway] Proxying Debate WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/world-leaders') || pathname.startsWith('/ws/live')) {
            console.log('[Gateway] Proxying World Leaders/Live WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else {
            console.warn(`[Gateway] No upgrade handler for ${pathname}`);
            socket.destroy();
        }
    } catch (err) {
        console.error('[Gateway] Upgrade Error:', err.message);
        socket.destroy();
    }
});

const MAX_LISTEN_RETRIES = 5;
const LISTEN_RETRY_MS = 3000;
let listenRetries = 0;

function startListening() {
    httpServer.listen(port, bindHost, (err) => {
        if (err) {
            if (err.code === 'EADDRINUSE' && listenRetries < MAX_LISTEN_RETRIES) {
                listenRetries++;
                console.warn(`[Gateway] Port ${port} in use, retry ${listenRetries}/${MAX_LISTEN_RETRIES} in ${LISTEN_RETRY_MS / 1000}s...`);
                setTimeout(startListening, LISTEN_RETRY_MS);
                return;
            }
            console.error(`[Gateway] Failed to listen on port ${port}:`, err.message);
            process.exit(1);
            return;
        }
        console.log(`> Gateway (auth-service-js) listening on http://${hostname}:${port} (bound to ${bindHost}, reachable on LAN)`);

        // Prepare Next.js in the background
        console.log('[Gateway] Starting Next.js preparation in background...');
        app.prepare().then(() => {
            isAppPrepared = true;
            console.log('[Gateway] Next.js app prepared and ready.');
        }).catch(e => {
            console.error('[Gateway] Next.js preparation FAILED:', e.message);
        });
    });
}

// Handle server errors. Do NOT exit on EADDRINUSE - startListening() retry will run from the listen callback.
httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        if (listenRetries < MAX_LISTEN_RETRIES) {
            console.warn(`[Gateway] Port ${port} in use (error event); retry ${listenRetries}/${MAX_LISTEN_RETRIES} will run.`);
            return;
        }
        console.error(`[Gateway] Port ${port} still in use after ${MAX_LISTEN_RETRIES} retries. Free it: netstat -ano | findstr :${port} then taskkill /PID <pid> /F`);
        process.exit(1);
    }
    console.error('[Gateway] Server error:', err.message);
    process.exit(1);
});

startListening();
