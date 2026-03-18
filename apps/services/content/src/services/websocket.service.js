let io;

exports.init = (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
        path: '/api/posts/ws',
        cors: {
            origin: (origin, callback) => callback(null, true),
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('[ContentService:MainWS] Client connected to root:', socket.id);

        socket.on('subscribe', (region) => {
            if (region) {
                socket.join(`region_${region}`);
                console.log(`[ContentService:WorldLeadersWS] Socket ${socket.id} joined region_${region}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('[ContentService:WorldLeadersWS] Client disconnected:', socket.id);
        });
    });

    // Feed namespace - for real-time updates when new/scheduled posts appear
    const feedNsp = io.of('/feed');
    feedNsp.on('connection', (socket) => {
        console.log('[ContentService:FeedWS] Client connected:', socket.id);
        socket.on('disconnect', () => {
            console.log('[ContentService:FeedWS] Client disconnected:', socket.id);
        });
    });

    // Enterprise Signals Namespace
    const enterpriseNsp = io.of('/enterprise-signals');
    enterpriseNsp.on('connection', (socket) => {
        console.log('[ContentService:EnterpriseWS] Analyst connected:', socket.id);
        socket.on('disconnect', () => {
            console.log('[ContentService:EnterpriseWS] Analyst disconnected:', socket.id);
        });
    });

    // Crisis Live Namespace
    const crisisNsp = io.of('/crisis-live');
    crisisNsp.on('connection', (socket) => {
        console.log('[ContentService:CrisisWS] Crisis Commander connected:', socket.id);
        socket.on('subscribe', (crisisId) => {
            if (crisisId) {
                socket.join(`crisis_${crisisId}`);
                console.log(`[ContentService:CrisisWS] Socket ${socket.id} joined crisis_${crisisId}`);
            }
        });
        socket.on('disconnect', () => {
            console.log('[ContentService:CrisisWS] Crisis Commander disconnected:', socket.id);
        });
    });

    // Soapbox Live Namespace
    const soapboxNsp = io.of('/soapbox-live');
    soapboxNsp.on('connection', (socket) => {
        console.log('[ContentService:SoapboxWS] Subscriber connected:', socket.id);
        socket.on('subscribe', (sessionId) => {
            if (sessionId) {
                socket.join(`soapbox_${sessionId}`);
                console.log(`[ContentService:SoapboxWS] Socket ${socket.id} joined soapbox_${sessionId}`);
            }
        });
        socket.on('disconnect', () => {
            console.log('[ContentService:SoapboxWS] Subscriber disconnected:', socket.id);
        });
    });

    // Debate Live Namespace
    const debateNsp = io.of('/debate-live');
    debateNsp.on('connection', (socket) => {
        console.log('[ContentService:DebateWS] Subscriber connected:', socket.id);
        // Clients join a room named for the debate ID
        socket.on('subscribe', (sessionId) => {
            if (sessionId) {
                socket.join(sessionId);
                console.log(`[ContentService:DebateWS] Socket ${socket.id} joined debate room: ${sessionId}`);
            }
        });
        socket.on('disconnect', () => {
            console.log('[ContentService:DebateWS] Subscriber disconnected:', socket.id);
        });
    });
};

exports.getIO = () => io;

exports.broadcastSoapboxEvent = (data, type) => {
    if (!io) return;
    console.log(`[WebSocket] Broadcasting ${type} event`);
    io.of('/soapbox-live').emit(type, data);
};

exports.broadcastCrisisEvent = (data, type) => {
    if (!io) return;
    console.log(`[WebSocket] Broadcasting ${type} event`);
    io.of('/crisis-live').emit(type, data);
};

exports.broadcastLiveStatus = (announcement) => {
    if (!io) return;

    // Broadcast to everyone
    io.emit('leader_live', announcement);

    // Optionally broadcast to specific regions
    if (announcement.regions && Array.isArray(announcement.regions)) {
        announcement.regions.forEach(region => {
            io.to(`region_${region}`).emit('leader_live', announcement);
        });
    }
};

exports.broadcastNewPost = (announcement) => {
    if (!io) return;
    io.emit('new_leader_post', announcement);
};

exports.broadcastEnterpriseSignal = (signal) => {
    if (!io) return;
    // Broadcast on the enterprise namespace
    io.of('/enterprise-signals').emit('new_market_signal', signal);
};

/** Emit when a new post is published (immediate or scheduled) - client triggers feed refresh */
exports.broadcastFeedUpdate = () => {
    if (!io) return;
    io.of('/feed').emit('post_published', { timestamp: new Date().toISOString() });
};
