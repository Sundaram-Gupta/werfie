const axios = require('axios');
const jwt = require('jsonwebtoken');

const CONTENT_SERVICE_URL = 'http://localhost:3003';
const SECRET = process.env.JWT_SECRET || 'dev-secret';

async function runTest() {
    console.log("=== Structured Comments Testing Suite ===");

    // 1. Generate a "Verified Admin" token
    const token = jwt.sign({ id: 'test_verified_user', role: 'admin' }, SECRET);
    const authHeader = { 'Authorization': `Bearer ${token}` };

    try {
        // 2. Create an announcement with a 1-minute INFO-LOCK
        const ts = Date.now();
        console.log(`\n📝 Step 1: Creating announcement with 1-min info-lock [TS: ${ts}]...`);
        const annRes = await axios.post(`${CONTENT_SERVICE_URL}/api/announcements/create`, {
            institutionId: "inst_gov_001",
            title: `Policy Update: Digital Asset Regulation [TEST ${ts}]`,
            content: "Official framework for state-wide digital asset management...",
            category: "Policy",
            severityLevel: 3,
            regions: ["Country"],
            lockDurationMinutes: 1, // 1 minute lock
            status: "published"
        }, { headers: authHeader });

        const announcementId = annRes.data.id;
        console.log("✅ Announcement created. ID:", announcementId);

        // 3. Attempt to comment IMMEDIATELY (Should Fail - Lock Active)
        console.log("\n💬 Step 2: Attempting to comment during info-lock window...");
        try {
            await axios.post(`${CONTENT_SERVICE_URL}/api/comments/create`, {
                announcementId,
                content: "This is a premature opinion."
            }, { headers: authHeader });
            console.log("❌ Error: Comment should have been rejected by info-lock.");
        } catch (e) {
            console.log("✅ Received expected rejection:");
            if (e.response) {
                console.log(`   Status: ${e.response.status}`);
                console.log(`   Error: ${e.response.data.error}`);
            } else {
                console.log(`   Message: ${e.message}`);
            }
        }

        // 4. Create an announcement with 0 lock for success testing
        const ts2 = Date.now() + 1;
        console.log(`\n📝 Step 3: Creating announcement with NO info-lock [TS: ${ts2}]...`);
        const ann2Res = await axios.post(`${CONTENT_SERVICE_URL}/api/announcements/create`, {
            institutionId: "inst_gov_001",
            title: `Public Service Briefing [TEST ${ts2}]`,
            content: "General briefing regarding public transit updates...",
            category: "Update",
            severityLevel: 1,
            regions: ["Local"],
            lockDurationMinutes: 0,
            status: "published"
        }, { headers: authHeader });

        const openAnnouncementId = ann2Res.data.id;
        console.log("✅ Open Announcement created. ID:", openAnnouncementId);

        // 5. Submit a valid comment (Should succeed but be PENDING)
        console.log("\n💬 Step 4: Submitting a valid comment...");
        try {
            const commentRes = await axios.post(`${CONTENT_SERVICE_URL}/api/comments/create`, {
                announcementId: openAnnouncementId,
                content: "A well-structured and factual contribution to the discourse."
            }, { headers: authHeader });

            console.log("✅ Comment submitted. Status:", commentRes.data.comment.moderationStatus);

            // 6. Check Moderation Queue
            console.log("\n🔎 Step 5: Checking moderation queue...");
            const queueRes = await axios.get(`${CONTENT_SERVICE_URL}/api/comments/moderation/queue`, { headers: authHeader });
            const queueItem = queueRes.data.find(q => q.commentId === commentRes.data.comment.id);

            if (queueItem) {
                console.log("✅ Found item in moderation queue. ID:", queueItem.id);

                // 7. Approve the comment
                console.log("\n🛡️ Step 6: Approving the comment...");
                await axios.post(`${CONTENT_SERVICE_URL}/api/comments/moderation/approve/${queueItem.id}`, {}, { headers: authHeader });
                console.log("✅ Comment approved.");

                // 8. Verify visibility
                console.log("\n👀 Step 7: Verifying comment visibility on public API...");
                const listRes = await axios.get(`${CONTENT_SERVICE_URL}/api/comments/${openAnnouncementId}`);
                if (listRes.data.length > 0) {
                    console.log("✅ Comment is now visible publicly.");
                    console.log("   Content:", listRes.data[0].content);
                } else {
                    console.log("❌ Comment is still hidden.");
                }
            } else {
                console.log("❌ Comment failed to enter moderation queue.");
            }
        } catch (e) {
            console.log("❌ Error submitting comment:");
            if (e.response) {
                console.log(`   Status: ${e.response.status}`);
                console.log(`   Data:`, e.response.data);
            } else {
                console.log(`   Message: ${e.message}`);
            }
        }

    } catch (e) {
        console.error("Test process failed:", e.message);
    } finally {
        console.log("\n=== Testing Complete ===");
        process.exit(0);
    }
}

runTest();
