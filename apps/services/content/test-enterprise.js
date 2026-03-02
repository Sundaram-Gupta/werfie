const axios = require('axios');
const io = require('socket.io-client');

const CONTENT_SERVICE_URL = 'http://localhost:3003';

async function runTest() {
    console.log("=== Enterprise Intelligence Testing Suite ===");

    // 1. Connect to WebSocket
    const socket = io(`${CONTENT_SERVICE_URL}/enterprise-signals`, { path: '/ws/world-leaders' });

    let signalReceived = false;
    socket.on('connect', () => {
        console.log("🟢 Connected to WS: /enterprise-signals");
    });

    socket.on('new_market_signal', (signal) => {
        console.log("\n🚀 [LIVE WS] Received New High-Impact Signal:");
        console.log(JSON.stringify(signal, null, 2));
        signalReceived = true;
    });

    // Wait a brief moment for socket connection
    await new Promise(r => setTimeout(r, 1000));

    // Generate a valid JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 'test_admin_123', role: 'admin' }, process.env.JWT_SECRET || 'dev-secret');

    try {
        // 2. Mock User Auth Header (If middleware requires, but our local might bypass if req.user is mocked)
        // Creating an announcement
        console.log("\n📝 Submitting a test Breaking Announcement...");

        // This will trigger announcement.service -> enterprise.service -> WS Broadcast
        const res = await axios.post(`${CONTENT_SERVICE_URL}/api/announcements/create`, {
            institutionId: "inst_test_123", // Needs to match db if constraints, but string is fine
            title: `Global Supply Chain Disruption Expected in Q3 [TEST: ${Date.now()}]`,
            content: "Due to unforeseen logistical bottlenecks, global trade routes are experiencing severe delays...",
            category: "Economy", // Economy has weight 25
            severityLevel: 5,   // Base 50
            regions: ["Global"],
            attachments: [],
            isWorldLeaderPost: true,
            leaderPriorityScore: 8, // PRIORITY 8 * 2 = 16
            isLive: false,
            status: "published" // Must be published to trigger signal
        }, {
            // Mock auth - inject a user ID
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("✅ Announcement created. ID:", res.data.id);

        // Wait for Async Enterprise Signal Generation and WS Broadcast
        console.log("⏳ Waiting for Intelligence Engine processing...");
        await new Promise(r => setTimeout(r, 2000));

        // 3. Verify via REST API
        console.log("\n📊 Fetching latest signals from API...");
        const metricsRes = await axios.get(`${CONTENT_SERVICE_URL}/api/enterprise/signals`);
        const latest = metricsRes.data.signals.find(s => s.announcementId === res.data.id);

        if (latest) {
            console.log("✅ Signal successfully stored in DB:");
            console.log(`   ID: ${latest.id}`);
            console.log(`   Impact Score: ${latest.impactScore} / 100`);
            console.log(`   Volatility Index: ${latest.volatilityIndex}`);
        } else {
            console.log("❌ Failed to find generated signal in DB.");
        }

    } catch (e) {
        console.error("Test failed:", e.response ? e.response.data : e.message);
    } finally {
        socket.disconnect();
        console.log("\n=== Testing Complete ===");
        process.exit(0);
    }
}

runTest();
