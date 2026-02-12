const { PrismaClient } = require('@prisma/client');

const DIRECT_USER_URL = 'http://localhost:3002';
const DIRECT_CONTENT_URL = 'http://localhost:3003';
const DIRECT_MONETIZATION_URL = 'http://localhost:3014';
const DIRECT_ADMIN_URL = 'http://localhost:3012/api/admin';

async function post(url, body, h) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(h || {})
        },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw { message: `POST ${url} failed`, response: { status: res.status, data } };
    }
    return data;
}

async function get(url, h) {
    const res = await fetch(url, { headers: h });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw { message: `GET ${url} failed`, response: { status: res.status, data } };
    }
    return data;
}

async function runTests() {
    console.log('🚀 Starting Comprehensive Backend Verification...\n');

    const prisma = new PrismaClient();

    try {
        // Step 0: Seed Users
        console.log('--- Database Seeding ---');
        const ts = Date.now();
        const owner = await prisma.user.create({
            data: {
                email: `owner_${ts}@test.com`,
                passwordHash: 'hashed',
                profile: { create: { name: 'Biz Owner', handle: `owner${ts}` } }
            }
        });
        const member = await prisma.user.create({
            data: {
                email: `member_${ts}@test.com`,
                passwordHash: 'hashed',
                profile: { create: { name: 'Team Member', handle: `member${ts}` } }
            }
        });
        console.log(`✅ Seeded Owner: ${owner.id}`);
        console.log(`✅ Seeded Member: ${member.id}`);

        const headers = { 'x-user-id': owner.id };

        // 1. Business Profile Tests
        console.log('\n--- Business Profile ---');
        await post(`${DIRECT_USER_URL}/business`, {
            companyName: 'Werfie Corp',
            industry: 'Social Media',
            website: 'https://werfie.com'
        }, headers);
        console.log('✅ Create Business Profile: Success');

        await get(`${DIRECT_USER_URL}/business/stats`, headers);
        console.log('✅ Fetch Business Stats: Success');

        await post(`${DIRECT_USER_URL}/business/team`, {
            memberId: member.id,
            role: 'admin'
        }, headers);
        console.log('✅ Add Team Member: Success');

        // 2. Ads Tests
        console.log('\n--- Ads Manager ---');
        const account = await get(`${DIRECT_CONTENT_URL}/ads/account`, headers);
        console.log('✅ Fetch/Create Ad Account: Success');

        const campaign = await post(`${DIRECT_CONTENT_URL}/ads/campaigns`, {
            adAccountId: account.id,
            name: 'Wefie Launch Campaign',
            type: 'awareness',
            dailyBudget: 100,
            startTime: new Date().toISOString(),
            targeting: { regions: ['Global'] }
        }, headers);
        console.log('✅ Create Campaign: Success');

        await post(`${DIRECT_CONTENT_URL}/ads/ads`, {
            campaignId: campaign.id,
            name: 'Launch Video',
            headline: 'Join Werfie Today!',
            primaryMediaUrl: 'https://cdn.werfie.com/v1.mp4',
            mediaType: 'video'
        }, headers);
        console.log('✅ Create Ad Creative: Success');

        // 3. Monetization Tests
        console.log('\n--- Monetization ---');
        const mProfile = await post(`${DIRECT_MONETIZATION_URL}/apply`, {}, headers);
        console.log('✅ Apply for Monetization: Success');

        const tier = await post(`${DIRECT_MONETIZATION_URL}/tiers`, {
            name: 'Super Supporter',
            price: 5.00,
            description: 'Help us grow!',
            perks: ['Badge', 'Exclusive Content']
        }, headers);
        console.log('✅ Create Subscription Tier: Success');

        const subHeaders = { 'x-user-id': member.id };
        await post(`${DIRECT_MONETIZATION_URL}/subscribe`, { tierId: tier.id }, subHeaders);
        console.log('✅ Subscriber (Member) joined: Success');

        await get(`${DIRECT_MONETIZATION_URL}/transactions`, headers);
        console.log('✅ Fetch Transactions (Owner): Success');

        // 4. Admin Checks
        console.log('\n--- Admin Moderation ---');
        await get(`${DIRECT_ADMIN_URL}/monetization`, headers);
        console.log('✅ Admin: Fetch Monetization Applications: Success');

        await get(`${DIRECT_ADMIN_URL}/business`, headers);
        console.log('✅ Admin: Fetch Business Applications: Success');

        console.log('\n✨ CONGRATULATIONS! All backend services are working perfectly.');
    } catch (error) {
        console.error('\n❌ Verification Failed:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
            if (error.stack) console.error(error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
}

runTests();
