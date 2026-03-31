require('dotenv').config();
const express = require('express');
const next = require('next');
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const fs = require('fs');

// WHATWG URL instead of deprecated url.parse()
function parseUrl(url, base = 'http://localhost') {
    try {
        const u = new URL(url, base);
        const query = {};
        u.searchParams.forEach((v, k) => { query[k] = v; });
        return { pathname: u.pathname, query };
    } catch {
        return { pathname: (url && url.split('?')[0]) || '/', query: {} };
    }
}
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const cookieParser = require('cookie-parser');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;
// Bind to 0.0.0.0 so gateway (and Swagger) are reachable on WiFi IP (e.g. http://192.168.1.101:3001)
const bindHost = process.env.HOST || process.env.BIND_HOST || '0.0.0.0';

// Service targets - use env vars for flexibility, fallback to defaults (no trailing slash)
// Service targets - use env vars for flexibility, fallback to defaults (no trailing slash)
const USER_SERVICE_TARGET = (process.env.USER_SERVICE_URL || `http://127.0.0.1:${process.env.USER_SERVICE_PORT || 3002}`).replace(/\/+$/, '');
const CONTENT_SERVICE_TARGET = (process.env.CONTENT_SERVICE_URL || `http://127.0.0.1:3003`).replace(/\/+$/, '');
const MESSAGING_SERVICE_TARGET = (process.env.MESSAGING_SERVICE_URL || `http://127.0.0.1:3019`).replace(/\/+$/, '');

const app = next({ dev, hostname });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true
});

// Response logging for proxy
proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log(`[Gateway] Received ${proxyRes.statusCode} from ${req.url}`);
});

// Error handling for proxy
proxy.on('error', (err, req, res) => {
    console.error(`[Gateway] Proxy Error [${req.url}]:`, err.message);
    if (res && res.writeHead && !res.headersSent) {
        const isConnRefused = err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
        const status = 200; // Force 200 per user request
        const hint = isConnRefused && req.url?.includes('creator-studio')
            ? ' (Service may be down)'
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
    // Ensure admin / proxied routes keep auth that browsers send (Swagger UI + cookies).
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
        proxyReq.setHeader('Authorization', authHeader);
    }
    const cookieHeader = req.headers.cookie || req.headers.Cookie;
    if (cookieHeader) {
        proxyReq.setHeader('Cookie', cookieHeader);
    }
    // Forward user headers if injected by injectUserFromToken
    // Forward user headers if injected by injectUserFromToken
    if (req._gatewayUser) {
        proxyReq.setHeader('x-verified-gateway', 'true');
        proxyReq.setHeader('x-user-id', String(req._gatewayUser.userId));
        proxyReq.setHeader('x-user-email', req._gatewayUser.email || '');
    }
    const targetString = typeof options.target === 'string' ? options.target : (options.target.href || String(options.target));
    // Collapse multiple slashes in the path to avoid Socket.io 400 errors
    if (proxyReq.path) {
        proxyReq.path = proxyReq.path.replace(/\/+/g, '/');
    }
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

mainServer.use(cookieParser());
mainServer.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-User-Id',
        'X-Api-Version',
        'X-CSRF-Token',
        'Cache-Control',
        'Pragma'
    ]
}));

// Explicit preflight handler: mirror requested headers to avoid browser-specific CORS blocks.
mainServer.options('*', (req, res) => {
    const origin = req.headers.origin || '*';
    const requested = req.headers['access-control-request-headers'];
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        requested || 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-User-Id, X-Api-Version, X-CSRF-Token, Cache-Control, Pragma'
    );
    return res.sendStatus(204);
});



// Auth login on Express so POST /api/auth/login always works (Next custom server can miss App Router POST → "Cannot POST /api/auth/login")
const { gatewayLogin } = require('./lib/gateway-auth-login.cjs');
mainServer.post('/api/auth/login', express.json({ limit: '512kb' }), async (req, res) => {
    try {
        console.log('[Gateway] Login request for email:', req.body?.email);
        const result = await gatewayLogin(req.body);
        console.log('[Gateway] Login result status:', result.status, 'message:', result.json?.message);
        if (result.status === 200 && result.json?.data?.accessToken) {
            res.cookie('accessToken', result.json.data.accessToken, { 
                httpOnly: false, // browser/swagger can read for dev
                secure: false, // insecure dev
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matches accessToken expiry
                sameSite: 'lax',
                path: '/'
            });
        }
        return res.status(result.status).json(result.json);
    } catch (e) {
        console.error('[Gateway] /api/auth/login error:', e);
        const msg = e?.message || String(e);
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({
            status: false,
            message: isDev ? msg : 'Internal server error',
            data: isDev ? { error: msg } : null
        });
    }
});

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
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.send(fs.readFileSync(swaggerPath, 'utf8'));
    });
    // Serve a custom Swagger UI HTML so it works on LAN devices too.
    // (swagger-ui-express cannot reliably accept JS function interceptors because options are serialized)
    mainServer.get('/api-docs', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'docs.html'));
    });
    mainServer.get('/api-docs/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'docs.html'));
    });
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
    let token = authHeader && typeof authHeader === 'string' && authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
    
    // Cookie fallback (helpful for browser/swagger dev)
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (token) {
        try {
            console.log(`[Gateway] Verifying token for ${req.url}: ${token.substring(0, 20)}...`);
            console.log(`[Gateway] Using JWT_SECRET: ${JWT_SECRET}`);
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.sub || decoded.userId || decoded.id;
            if (userId) {
                req._gatewayUser = { userId: String(userId), email: decoded.email || '' };
                req.headers['x-verified-gateway'] = 'true';
                req.headers['x-user-id'] = String(userId);
                req.headers['x-user-email'] = (decoded.email || '').toString();
                console.log(`[Gateway] Successfully verified token for userId: ${userId}`);
            }
        } catch (e) {
            console.warn(`[Gateway] JWT Verification failed for ${req.url}: ${e.message}`);
            // Verification failed - downstream may return 401
        }
    } else {
        if (authHeader) {
            console.warn(`[Gateway] No token found in Authorization header: ${authHeader}`);
        }
    }
}

mainServer.all('/api/messages*', (req, res, next) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: MESSAGING_SERVICE_TARGET });
});

// 2. Content Service Proxy – verify JWT at gateway and inject x-user-id for posts, etc.
mainServer.all('/api/posts*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: CONTENT_SERVICE_TARGET });
});
mainServer.all('/api/explore*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: CONTENT_SERVICE_TARGET });
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
    proxy.web(req, res, { target: CONTENT_SERVICE_TARGET });
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
mainServer.all('/api/highlights*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/articles*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/enterprise*', (req, res) => {
    injectUserFromToken(req);
    proxy.web(req, res, { target: USER_SERVICE_TARGET });
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
    proxy.web(req, res, { target: CONTENT_SERVICE_TARGET });
});

// Search – proxy directly to unified search router in content service
mainServer.all('/api/search*', (req, res) => {
    injectUserFromToken(req);
    const orig = req.url;
    // Map /api/search/* to /search/* on content-service
    req.url = orig.replace('/api/search', '/search');
    proxy.web(req, res, { target: CONTENT_SERVICE_TARGET });
});

// 4. Other Microservices Catch-all (search handled above by direct proxy to user/content)
const microservices = [
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
    const base = `http://${req.headers.host || hostname}`;
    const parsedUrl = parseUrl(req.url, base);
    handle(req, res, parsedUrl);
});

// Final catch-all Error Handler to ensure "All API responses are 200" for testing
mainServer.use((err, req, res, next) => {
    console.error(`[Gateway] Unhandled Error [${req.method} ${req.url}]:`, err.message);
    const status = 200; // Force 200 per user request
    const message = err instanceof SyntaxError ? "JSON Syntax Error: " + err.message : (err.message || "Internal Server Error");
    
    return res.status(status).json({
        status: false,
        message,
        data: {
            error: err.name || "Error",
            details: err.stack?.split('\n').slice(0, 3).join('\n'), // small snippet for debugging
            path: req.url
        }
    });
});

// 6. WebSocket Upgrade Handling
httpServer.on('upgrade', (req, socket, head) => {
    try {
        const url = req.url || '';
        const parsedUrl = parseUrl(url);
        const pathname = parsedUrl.pathname || '';
        console.log(`[Gateway] Upgrade request: ${pathname}`);

        if (pathname.startsWith('/api/messages/ws')) {
            console.log('[Gateway] Proxying WebSocket to Messaging Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3019' });
        } else if (pathname.includes('/api/posts/ws')) {
            console.log('[Gateway] Proxying WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/live')) {
            console.log('[Gateway] Proxying WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.includes('/ws/live')) {
            console.log('[Gateway] Proxying WebSocket (fuzzy match) to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/soapbox-live')) {
            console.log('[Gateway] Proxying Soapbox WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/debate-live')) {
            console.log('[Gateway] Proxying Debate WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/world-leaders')) {
            console.log('[Gateway] Proxying World Leaders WebSocket to Content Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3003' });
        } else if (pathname.startsWith('/ws/enterprise-signals')) {
            console.log('[Gateway] Proxying Enterprise Signals WebSocket to User Service');
            proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3002' });
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
let listenRetryTimer = null;
let isListenInFlight = false;
let isServerBound = false;

function clearRetryTimer() {
    if (listenRetryTimer) {
        clearTimeout(listenRetryTimer);
        listenRetryTimer = null;
    }
}

function scheduleListenRetry(reason) {
    if (isServerBound || listenRetryTimer) return;
    if (listenRetries >= MAX_LISTEN_RETRIES) {
        console.error(`[Gateway] Port ${port} still unavailable after ${MAX_LISTEN_RETRIES} retries (${reason}). Continuing retries without crashing...`);
        listenRetries = 0;
    }
    listenRetries++;
    console.warn(`[Gateway] Port ${port} in use (${reason}); retry ${listenRetries}/${MAX_LISTEN_RETRIES} in ${LISTEN_RETRY_MS / 1000}s...`);
    listenRetryTimer = setTimeout(() => {
        listenRetryTimer = null;
        startListening();
    }, LISTEN_RETRY_MS);
}

function startListening() {
    if (isServerBound || isListenInFlight) return;
    clearRetryTimer();
    isListenInFlight = true;
    httpServer.listen(port, bindHost, (err) => {
        isListenInFlight = false;
        if (err) {
            if (err.code === 'EADDRINUSE') {
                scheduleListenRetry('listen callback');
                return;
            }
            console.error(`[Gateway] Failed to listen on port ${port}:`, err.message);
            scheduleListenRetry(`listen callback ${err.code || 'error'}`);
            return;
        }
        isServerBound = true;
        listenRetries = 0;
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

// Handle server errors. 
httpServer.on('error', (err) => {
    isListenInFlight = false;
    if (err.code === 'EADDRINUSE') {
        scheduleListenRetry('error event');
        return;
    }
    console.error('[Gateway] Server error:', err.message);
    scheduleListenRetry(`server error ${err.code || 'unknown'}`);
});

startListening();
