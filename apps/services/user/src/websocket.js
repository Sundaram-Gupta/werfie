const { WebSocketServer } = require('ws');
const { parse } = require('url');

let wss;

function initWebSocketServer(server) {
    wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws, request) => {
        console.log('[WebSocket] Enterprise Signals client connected');
        ws.isAlive = true;
        
        ws.on('pong', () => {
             ws.isAlive = true;
        });

        ws.on('close', () => {
            console.log('[WebSocket] Enterprise Signals client disconnected');
        });
    });

    server.on('upgrade', (request, socket, head) => {
        const { pathname } = parse(request.url);

        if (pathname === '/ws/enterprise-signals') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            // Unhandled upgrades might be handled by other mechanisms (if any)
            // Or just destroyed here if we exclusively own upgrades on this port
        }
    });

    // Heartbeat to prevent stale connections
    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
    
    console.log('[WebSocket] Enterprise Signals WS server initialized');
}

function broadcastEvent(type, payload) {
    if (!wss) return;
    const message = JSON.stringify({ type, payload });
    wss.clients.forEach((client) => {
        if (client.readyState === 1 /* WebSocket.OPEN */) {
            client.send(message);
        }
    });
}

module.exports = {
    initWebSocketServer,
    broadcastEvent
};
