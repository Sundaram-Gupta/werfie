const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

// GET /: Fetch institutional profile
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await prisma.institutionalProfile.findUnique({
            where: { userId }
        });

        if (!profile) {
            return res.json(null);
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching institutional profile:', error);
        res.status(500).json({ error: 'Failed to fetch institutional profile' });
    }
});

// POST /: Create or update institutional profile
router.post('/', authenticateToken, async (req, res) => {
    console.log('[DEBUG] Institutional POST received for user:', req.user.userId);
    try {
        const userId = req.user.userId;
        const {
            institutionName, institutionType, country, state, website,
            officialEmailDomain, description, logoUrl, bannerUrl,
            repFullName, repJobTitle, repDepartment, repOfficialEmail,
            repPhone, repIdUrl, repLinkedInUrl, repAuthLetterUrl,
            twoFactorEnabled, primaryRole, recoveryEmail, recoveryPhone,
            supportingDocs, transparencyAccepted, termsAccepted,
            publicDisplayName, publicBio, headquarters, categories, languages
        } = req.body;

        if (!institutionName || !institutionType) {
            return res.status(400).json({ error: 'Institution name and type are required' });
        }

        const profile = await prisma.institutionalProfile.upsert({
            where: { userId },
            update: {
                institutionName, institutionType, country, state, website,
                officialEmailDomain, description, logoUrl, bannerUrl,
                repFullName, repJobTitle, repDepartment, repOfficialEmail,
                repPhone, repIdUrl, repLinkedInUrl, repAuthLetterUrl,
                twoFactorEnabled, primaryRole, recoveryEmail, recoveryPhone,
                supportingDocs, transparencyAccepted, termsAccepted,
                publicDisplayName, publicBio, headquarters, categories, languages
            },
            create: {
                userId,
                institutionName, institutionType, country, state, website,
                officialEmailDomain, description, logoUrl, bannerUrl,
                repFullName, repJobTitle, repDepartment, repOfficialEmail,
                repPhone, repIdUrl, repLinkedInUrl, repAuthLetterUrl,
                twoFactorEnabled, primaryRole, recoveryEmail, recoveryPhone,
                supportingDocs, transparencyAccepted, termsAccepted,
                publicDisplayName, publicBio, headquarters, categories, languages,
                status: 'pending'
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error saving institutional profile:', error);
        console.error('FULL ERROR JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        res.status(500).json({ error: 'Failed to save institutional profile', details: error.message });
    }
});

// POST /verify-domain: Mock endpoint for domain verification
router.post('/verify-domain', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        // In a real scenario, we'd send an OTP to the domain email
        await prisma.institutionalProfile.update({
            where: { userId },
            data: { isDomainVerified: true }
        });
        res.json({ message: 'Domain verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify domain' });
    }
});

// PATCH /admin/review/:id: Admin endpoint to review profile (Mock internal)
router.patch('/admin/review/:id', authenticateToken, async (req, res) => {
    try {
        // Here we would check if req.user.role === 'ADMIN'
        const { id } = req.params;
        const { status, adminNotes, badgeType } = req.body;

        const profile = await prisma.institutionalProfile.update({
            where: { id },
            data: {
                status,
                adminNotes,
                badgeType,
                isVerified: status === 'approved'
            }
        });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update review status' });
    }
});

module.exports = router;
