const axios = require('axios');

async function verifyDetailed() {
    const baseUrl = 'http://localhost:3002/api/institutional';

    // Testing registration with complete field set
    const testData = {
        institutionName: "Global Health Ministry",
        institutionType: "ministry",
        country: "UAE",
        website: "https://health.gov.ae",
        officialEmailDomain: "gov.ae",
        description: "Ministry responsible for national health policies.",
        repFullName: "Dr. Ahmed Mansoor",
        repJobTitle: "Lead Advisor",
        publicDisplayName: "Ministry of Health",
        categories: ["Health", "Public Policy"],
        languages: ["English", "Arabic"]
    };

    try {
        console.log('Testing GET /api/institutional (Checking route registration)...');
        const res = await axios.get(baseUrl);
        console.log('Status:', res.status);
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('Verified: Authentication middleware is active.');
        } else {
            console.error('Error fetching:', error.response?.status, error.response?.data);
        }
    }
}

verifyDetailed();
