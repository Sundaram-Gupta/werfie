const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function testFullFlow() {
    console.log('Prisma Client Path:', require.resolve('@prisma/client'));
    const AUTH_URL = 'http://localhost:3001/api/auth/login';
    const INST_URL = 'http://localhost:3002/api/institutional';

    try {
        console.log('--- Phase 1: Direct Prisma Check ---');
        try {
            console.log('InstitutionalProfile Runtime Fields:', prisma._runtimeDataModel.models.InstitutionalProfile.fields.map(f => f.name));

            const raw = await prisma.$queryRaw`SELECT * FROM "InstitutionalProfile" LIMIT 1`;
            if (raw.length > 0) {
                console.log('✅ Success: Raw SQL can read InstitutionalProfile.');
                console.log('   Raw Keys:', JSON.stringify(Object.keys(raw[0])));
                console.log('   Raw Data (Partial):', raw[0].institutionName, raw[0].twoFactorEnabled);
            }

            const row = await prisma.institutionalProfile.findFirst();
            if (row) {
                console.log('✅ Success: Direct Prisma can read table.');
                console.log('   Institution:', row.institutionName);
                console.log('   Keys Found:', JSON.stringify(Object.keys(row)));
                console.log('   twoFactorEnabled:', row.twoFactorEnabled);
            } else {
                console.log('✅ Success: Direct Prisma can read table. Table is empty.');
            }
        } catch (e) {
            console.error('❌ Failure: Direct Prisma error:', e.message);
            // We continue anyway to see if API works
        }

        console.log('\n--- Phase 2: Login ---');
        console.log('Attempting login to', AUTH_URL);
        const loginRes = await axios.post(AUTH_URL, {
            email: 'user1@xclone.com',
            password: 'password123'
        });

        const token = loginRes.data.token || loginRes.data.accessToken;
        if (!token) throw new Error('No token received');
        console.log('✅ Success: Login successful. Token obtained.');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const testData = {
            institutionName: "Werfie Sovereign Authority V2",
            institutionType: "central_bank",
            country: "Global",
            state: "Digital",
            website: "https://sovereign.werfie",
            officialEmailDomain: "werfie",
            description: "Supreme authority for digital sovereign communications.",
            repFullName: "Antigravity Agent",
            repJobTitle: "Lead Implementation Engineer",
            repDepartment: "Advanced Agentic Coding",
            repOfficialEmail: "agent@werfie",
            twoFactorEnabled: true,
            primaryRole: "admin",
            recoveryEmail: "recovery@werfie",
            publicDisplayName: "Werfie Trust & Safety",
            publicBio: "Building a more sovereign world, one block at a time.",
            categories: ["Defense", "Finance", "Infrastructure"],
            languages: ["English", "Binary"],
            transparencyAccepted: true,
            termsAccepted: true
        };

        console.log('\n--- Phase 3: Submit Profile ---');
        console.log('Posting to', INST_URL);
        const postRes = await axios.post(INST_URL, testData, config);
        console.log('✅ Success: Profile saved. Status:', postRes.status);

        console.log('\n--- Phase 4: Verify Persistence ---');
        const getRes = await axios.get(INST_URL, config);

        const data = getRes.data;
        if (data && data.institutionName === testData.institutionName) {
            console.log('✅ FINAL SUCCESS: Data persisted correctly.');
            console.log('   Institution:', data.institutionName);
            console.log('   Role:', data.primaryRole);
        } else {
            console.error('❌ FINAL FAILURE: Data mismatch.');
            console.log('   Expected:', testData.institutionName);
            console.log('   Received:', data?.institutionName);
        }

    } catch (error) {
        console.error('\n❌ ERROR IN FLOW:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Message:', error.message);
        }
    }
}

testFullFlow();
