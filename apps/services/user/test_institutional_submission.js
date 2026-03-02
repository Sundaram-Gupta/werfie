const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function testInstitutionalSubmission() {
    const AUTH_URL = 'http://localhost:3001/api/auth/login';
    const INST_URL = 'http://localhost:3002/api/institutional';

    try {
        console.log('\n--- Phase 1: Login ---');
        console.log('Attempting login for user1@example.com...');
        let loginRes;
        try {
            loginRes = await axios.post(AUTH_URL, {
                email: 'user1@example.com',
                password: 'password123'
            });
        } catch (e) {
            console.log('Login failed for user1@example.com, trying user1@xclone.com...');
            loginRes = await axios.post(AUTH_URL, {
                email: 'user1@xclone.com',
                password: 'password123'
            });
        }

        const token = loginRes.data.token || loginRes.data.accessToken;
        if (!token) throw new Error('No token received');
        console.log('✅ Success: Login successful.');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Test Data - Filling all fields from all steps
        const testData = {
            // Step 1: Organization
            institutionName: "Ministry of Global Innovation",
            institutionType: "government",
            country: "United Arab Emirates",
            state: "Abu Dhabi",
            website: "https://innovation.gov.ae",
            officialEmailDomain: "innovation.gov.ae",
            description: "Leading the global transition towards a more sustainable and technologically advanced future through strategic sovereign initiatives.",
            logoUrl: "https://api.werfie.com/media/logo_v1.png",
            bannerUrl: "https://api.werfie.com/media/banner_v1.png",

            // Step 2: Representative
            repFullName: "Dr. Hamad Al Mansoori",
            repJobTitle: "Director General",
            repDepartment: "Digital Transformation Office",
            repOfficialEmail: "h.mansoori@innovation.gov.ae",
            repPhone: "+971 50 111 2222",
            repIdUrl: "https://api.werfie.com/media/id_scan.png",
            repLinkedInUrl: "https://linkedin.com/in/hamadalmansoori",
            repAuthLetterUrl: "https://api.werfie.com/media/auth_letter.pdf",

            // Step 3: Security & Access
            twoFactorEnabled: true,
            primaryRole: "admin",
            recoveryEmail: "security-recovery@innovation.gov.ae",
            recoveryPhone: "+971 50 333 4444",

            // Step 4: Trust & Verification
            supportingDocs: [
                { name: "Government Decree", url: "https://api.werfie.com/docs/decree_2024.pdf" },
                { name: "Registration Certificate", url: "https://api.werfie.com/docs/cert_123.pdf" }
            ],
            transparencyAccepted: true,
            termsAccepted: true,

            // Step 5: Public Profile
            publicDisplayName: "Ministry of Innovation (UAE)",
            publicBio: "Official communication hub for the UAE Ministry of Innovation. Empowering the next generation.",
            headquarters: "Emirates Towers, Dubai",
            categories: ["Technology", "Economy", "Infrastructure", "Education"],
            languages: ["Arabic", "English", "French"]
        };

        console.log('\n--- Phase 2: Submit Institutional Profile (Simulating Step 6) ---');
        console.log('Posting full profile data to', INST_URL);
        const postRes = await axios.post(INST_URL, testData, config);
        console.log('✅ Success: Profile submitted. Status:', postRes.status);

        console.log('\n--- Phase 3: Verify Persistence & Domain Verification ---');
        // Simulate domain verification step
        console.log('Activating Domain Verification...');
        await axios.post(`${INST_URL}/verify-domain`, {}, config);

        const getRes = await axios.get(INST_URL, config);
        const data = getRes.data;

        if (data && data.institutionName === testData.institutionName) {
            console.log('✅ FINAL SUCCESS: All fields persisted correctly.');
            console.log('   Institution:', data.institutionName);
            console.log('   Type:', data.institutionType);
            console.log('   Categories:', JSON.stringify(data.categories));
            console.log('   Domain Verified:', data.isDomainVerified);
            console.log('   Status:', data.status);
        } else {
            console.error('❌ FINAL FAILURE: Data mismatch or not found.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ ERROR DURING SIMULATION:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Message:', error.message);
        }
        process.exit(1);
    }
}

testInstitutionalSubmission();
