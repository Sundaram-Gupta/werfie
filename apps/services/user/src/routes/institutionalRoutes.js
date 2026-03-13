const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { uploadToR2, isR2Enabled } = require('../utils/r2-upload');
const path = require('path');

// Multer Config (Memory Storage for Sharp processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WEBP and PDF files are allowed'), false);
        }
    }
});

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

// POST /upload: Upload institutional document
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { type } = req.body; // docType e.g. 'certificate', 'registration', 'auth-letter'
        let buffer = req.file.buffer;
        let extension = path.extname(req.file.originalname).substring(1).toLowerCase();
        let contentType = req.file.mimetype;

        // Process images with Sharp
        if (contentType.startsWith('image/')) {
            buffer = await sharp(buffer)
                .resize({ width: 1200, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            extension = 'webp';
            contentType = 'image/webp';
        }

        // Upload to R2
        const { url } = await uploadToR2(buffer, 'institutional', extension, contentType);

        res.json({ url });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
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
