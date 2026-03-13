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

// Service targets - use env vars for flexibility, fallback to defaults
const USER_SERVICE_TARGET = process.env.USER_SERVICE_URL || `http://127.0.0.1:${process.env.USER_SERVICE_PORT || 3002}`;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true
});

// Error handling for proxy
proxy.on('error', (err, req, res) => {
    console.error(`[Gateway] Proxy Error [${req.url}]:`, err.message);
    if (res && res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy error', details: err.message, path: req.url }));
    }
});

proxy.on('proxyReq', (proxyReq, req, res, options) => {
    if (req._gatewayUser) {
        proxyReq.setHeader('x-verified-gateway', 'true');
        proxyReq.setHeader('x-user-id', req._gatewayUser.userId);
        proxyReq.setHeader('x-user-email', req._gatewayUser.email || '');
    }
    const target = typeof options.target === 'string' ? options.target : (options.target?.href || '[Object Target]');
    console.log(`[Gateway] Proxying ${req.method} ${req.url} -> ${target}${proxyReq.path}`);
});

let isAppPrepared = false;

console.log('[Gateway] Starting Express server...');

const mainServer = express();
const httpServer = http.createServer(mainServer);

// Global CORS Middleware
mainServer.use(cors({
    origin: true, // Reflects the request origin, functionality equivalent to allow all but with credentials support
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Health check - always 200 when gateway is up (before proxy/catch-all)
mainServer.get('/api/health', (req, res) => {
    res.status(200).json({ status: true, message: 'Gateway healthy', data: { service: 'gateway', timestamp: new Date().toISOString() } });
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
            filter: true
        }
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
                req._gatewayUser = { userId, email: decoded.email || '' };
                req.headers['x-verified-gateway'] = 'true';
                req.headers['x-user-id'] = userId;
                req.headers['x-user-email'] = decoded.email || '';
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

// 4. Other Microservices Catch-all (timeline/notifications have explicit routes above)
const microservices = [
    { path: '/api/search', port: 3006 },
    { path: '/api/analytics', port: 3009 },
    { path: '/api/moderation', port: 3010 },
    { path: '/api/settings', port: 3011 },
    { path: '/api/monetization', port: 3014 },
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
        } else {
            console.warn(`[Gateway] No upgrade handler for ${pathname}`);
            socket.destroy();
        }
    } catch (err) {
        console.error('[Gateway] Upgrade Error:', err.message);
        socket.destroy();
    }
});

// Handle listen errors (e.g. EADDRINUSE) so we don't crash-loop silently
httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[Gateway] Port ${port} is already in use. Free it with: netstat -ano | findstr :${port} then taskkill /PID <pid> /F`);
        process.exit(1);
    }
    console.error('[Gateway] Server error:', err.message);
    process.exit(1);
});

// Start listening immediately
httpServer.listen(port, (err) => {
    if (err) {
        console.error(`[Gateway] Failed to listen on port ${port}:`, err.message);
        process.exit(1);
        return;
    }
    console.log(`> Gateway (auth-service-js) listening on http://${hostname}:${port}`);

    // Prepare Next.js in the background
    console.log('[Gateway] Starting Next.js preparation in background...');
    app.prepare().then(() => {
        isAppPrepared = true;
        console.log('[Gateway] Next.js app prepared and ready.');
    }).catch(err => {
        console.error('[Gateway] Next.js preparation FAILED:', err.message);
    });
});
