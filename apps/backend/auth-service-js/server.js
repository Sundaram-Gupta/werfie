const express = require('express');
const next = require('next');
const http = require('http');
const httpProxy = require('http-proxy');
const { parse } = require('url');
const cors = require('cors');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

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
    console.log(`[Gateway] Proxying ${req.method} ${req.url} -> ${options.target}${proxyReq.path}`);
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

// Logging middleware
mainServer.use((req, res, next) => {
    if (req.url && !req.url.startsWith('/_next')) {
        console.log(`[Gateway] ${req.method} ${req.url}`);
    }
    next();
});

// 1. Messaging Service Proxy (WS + REST)
mainServer.all('/api/messages*', (req, res) => {
    console.log(`[Gateway] Proxying REST to Messaging Service: ${req.url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:3019' });
});

// 2. Content Service Proxy
mainServer.all('/api/posts*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/explore*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/communities*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});
mainServer.all('/api/spaces*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/lists*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/ads*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/announcements*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/comments*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/ws/live*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/soapbox*', (req, res) => {
    console.log(`[Gateway] Explicit Proxy -> Soapbox: ${req.url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/crisis*', (req, res) => {
    console.log(`[Gateway] Explicit Proxy -> Crisis: ${req.url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});

mainServer.all('/api/debate*', (req, res) => {
    console.log(`[Gateway] Explicit Proxy -> Debate: ${req.url}`);
    proxy.web(req, res, { target: 'http://127.0.0.1:3003' });
});


// User Service Proxy
mainServer.all('/api/users*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3002' });
});

mainServer.all('/api/business*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3002' });
});

mainServer.all('/api/institutional*', (req, res) => {
    proxy.web(req, res, { target: 'http://127.0.0.1:3002' });
});


// 4. Other Microservices Catch-all
const microservices = [
    { path: '/api/timeline', port: 3003 },
    { path: '/api/notifications', port: 3003 },
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
            return res.status(503).json({ error: 'Gateway warming up' });
        }
        return res.status(503).send('Next.js is still preparing. Please wait...');
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

// Start listening immediately
httpServer.listen(port, (err) => {
    if (err) {
        console.error(`[Gateway] Failed to listen on port ${port}:`, err.message);
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
