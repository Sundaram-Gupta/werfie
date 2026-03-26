const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();
const authenticateToken = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    // In a real app, check req.user.role
    // For now, allow if authenticated (as it's a dev environment)
    next();
};

// GET /verifications: List all pending verification requests
router.get('/verifications', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { type, status = 'PENDING' } = req.query;
        const requests = await prisma.verificationRequest.findMany({
            where: {
                ...(type && { type }),
                status
            },
            include: {
                user: {
                    include: {
                        profile: true,
                        businessProfile: true,
                        institutionalProfile: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        console.error('Admin Verifications Error:', error);
        res.status(500).json({ error: 'Failed to fetch verification requests' });
    }
});

// PATCH /verifications/:id: Approve or reject a request
router.patch('/verifications/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, badgeType } = req.body;

        const request = await prisma.verificationRequest.update({
            where: { id },
            data: { status, notes },
            include: { user: true }
        });

        if (status === 'APPROVED') {
            if (request.type === 'BUSINESS' && request.businessId) {
                await prisma.businessProfile.update({
                    where: { id: request.businessId },
                    data: { isVerified: true, status: 'approved' }
                });
            } else if (request.type === 'INSTITUTION') {
                 await prisma.institutionalProfile.update({
                    where: { userId: request.userId },
                    data: { isVerified: true, status: 'approved', badgeType: badgeType || 'official' }
                });
            } else {
                // Individual verification
                await prisma.profile.update({
                    where: { userId: request.userId },
                    data: { verified: true }
                });
            }
        }

        res.json({ message: `Request ${status.toLowerCase()} successfully`, request });
    } catch (error) {
        console.error('Admin Review Error:', error);
        res.status(500).json({ error: 'Failed to review request' });
    }
});

// Backward compatibility for existing institutional admin routes
router.get('/institutional', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status = 'pending' } = req.query;
        const profiles = await prisma.institutionalProfile.findMany({
            where: { status },
            include: { user: { include: { profile: true } } }
        });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

router.patch('/institutional/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, badgeType, adminNotes } = req.body;
        const profile = await prisma.institutionalProfile.update({
            where: { id },
            data: { 
                status, 
                badgeType, 
                adminNotes, 
                isVerified: status === 'approved' 
            }
        });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
