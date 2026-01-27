// Node 18+ has native fetch


const API_URL = 'http://localhost:3001/api';

async function run() {
    try {
        console.log('1. Registering User...');
        const userSuffix = Math.floor(Math.random() * 10000);
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `space_test_${userSuffix}@example.com`,
                password: 'password123',
                name: 'Space Tester',
                handle: `spacetest${userSuffix}`
            })
        });

        if (!registerRes.ok) {
            const txt = await registerRes.text();
            throw new Error(`Register failed: ${txt}`);
        }

        const userData = await registerRes.json();
        const token = userData.accessToken;
        console.log('User registered:', userData.user.email);

        console.log('2. Creating Space...');
        const spacePayload = {
            title: `Test Space ${userSuffix}`,
            topics: ["Technology", "Testing"],
            privacy: "public"
        };

        const createRes = await fetch(`${API_URL}/spaces`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(spacePayload)
        });

        if (!createRes.ok) {
            const txt = await createRes.text();
            throw new Error(`Create Space failed: ${txt}`);
        }

        const space = await createRes.json();
        console.log('Space created:', space.id, space.title);

        console.log('3. Fetching Spaces...');
        const listRes = await fetch(`${API_URL}/spaces`);
        if (!listRes.ok) throw new Error('Fetch spaces failed');

        const listData = await listRes.json();
        console.log('Spaces list received with', listData.upcoming.length, 'upcoming spaces');

        const found = listData.upcoming.find(s => s.id === space.id);
        if (found) {
            console.log('SUCCESS: verify_spaces passed. Space found in list.');
            console.log('Space details:', found);
        } else {
            console.error('FAILURE: Created space NOT found in list.');
            console.log('List IDs:', listData.upcoming.map(s => s.id));
        }

    } catch (e) {
        console.error('VERIFICATION FAILED:', e);
        process.exit(1);
    }
}

run();
