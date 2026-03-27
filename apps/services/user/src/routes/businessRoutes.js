const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

const authenticateToken = require('../middleware/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Owner is always an implicit admin; ensure a BusinessMember row exists. */
async function ensureOwnerIsTeamAdmin(businessId, userId) {
    await prisma.businessMember.upsert({
        where: { businessId_userId: { businessId, userId } },
        create: { businessId, userId, role: 'admin' },
        update: { role: 'admin' }
    });
}

/** Business the user may act on as owner or admin member (team/settings/ads). */
async function resolveManagedBusiness(userId) {
    const owned = await prisma.businessProfile.findUnique({ where: { userId } });
    if (owned) {
        await ensureOwnerIsTeamAdmin(owned.id, userId);
        return owned;
    }
    const adminMembership = await prisma.businessMember.findFirst({
        where: { userId, role: { in: ['admin', 'ADMIN'] } },
        include: { business: true }
    });
    return adminMembership?.business || null;
}

/** Profile for stats/products: owned business, or any team membership. */
async function resolveParticipantBusiness(userId) {
    const owned = await prisma.businessProfile.findUnique({ where: { userId } });
    if (owned) {
        // Same behavior as /access: if own business onboarding is incomplete and user is
        // also a member elsewhere, prefer the team business workspace.
        if (!owned.onboardingCompleted) {
            const otherMembership = await prisma.businessMember.findFirst({
                where: { userId, businessId: { not: owned.id } },
                include: { business: true }
            });
            if (otherMembership?.business) return otherMembership.business;
        }
        return owned;
    }
    const m = await prisma.businessMember.findFirst({
        where: { userId },
        include: { business: true }
    });
    return m?.business || null;
}

function normalizeTeamRole(role) {
    const r = String(role || 'member').toLowerCase();
    return r === 'admin' ? 'admin' : 'member';
}

const PERMISSIONS = {
    TEAM_MANAGE: 'TEAM_MANAGE',
    ROLE_UPDATE: 'ROLE_UPDATE',
    INVITE_MEMBER: 'INVITE_MEMBER',
    REMOVE_MEMBER: 'REMOVE_MEMBER',
    POST_CREATE: 'POST_CREATE',
    POST_EDIT: 'POST_EDIT',
    POST_DELETE: 'POST_DELETE',
    PRODUCT_MANAGE: 'PRODUCT_MANAGE',
    AD_CREATE: 'AD_CREATE',
    AD_MANAGE: 'AD_MANAGE',
    VIEW_ANALYTICS: 'VIEW_ANALYTICS',
    SETTINGS_UPDATE: 'SETTINGS_UPDATE'
};

const ROLE_PERMISSIONS = {
    admin: new Set(Object.values(PERMISSIONS)),
    member: new Set([
        PERMISSIONS.POST_CREATE,
        PERMISSIONS.POST_EDIT,
        PERMISSIONS.POST_DELETE,
        PERMISSIONS.PRODUCT_MANAGE
    ])
};

function getPermissionMap(role) {
    const key = normalizeTeamRole(role);
    const allow = ROLE_PERMISSIONS[key] || ROLE_PERMISSIONS.member;
    return Object.values(PERMISSIONS).reduce((acc, p) => {
        acc[p] = allow.has(p);
        return acc;
    }, {});
}

async function getBusinessAccessState(userId) {
    const owned = await prisma.businessProfile.findUnique({ where: { userId } });
    if (owned) {
        // If a user owns a not-yet-onboarded business but is also a member of another
        // business, prefer the team workspace so they are not forced into owner onboarding.
        if (!owned.onboardingCompleted) {
            const otherMembership = await prisma.businessMember.findFirst({
                where: { userId, businessId: { not: owned.id } },
                include: { business: true }
            });
            if (otherMembership?.business) {
                const role = normalizeTeamRole(otherMembership.role);
                const done = !!otherMembership.business.onboardingCompleted;
                const ownerProfile = await prisma.profile.findUnique({
                    where: { userId: otherMembership.business.userId },
                    select: { name: true, handle: true, avatar: true, banner: true }
                });
                return {
                    hasBusiness: true,
                    role,
                    businessId: otherMembership.business.id,
                    isOwner: false,
                    onboardingCompleted: done,
                    canAccessDashboard: true,
                    permissions: getPermissionMap(role),
                    businessName: otherMembership.business.companyName || ownerProfile?.name || null,
                    ownerName: ownerProfile?.name || null,
                    ownerHandle: ownerProfile?.handle || null,
                    ownerAvatar: ownerProfile?.avatar || null,
                    ownerBanner: ownerProfile?.banner || null,
                    businessLogoUrl: otherMembership.business.logoUrl || null,
                    businessBannerUrl: otherMembership.business.bannerUrl || null,
                    business: otherMembership.business
                };
            }
        }

        await ensureOwnerIsTeamAdmin(owned.id, userId);
        const role = 'admin';
        const ownerProfile = await prisma.profile.findUnique({
            where: { userId: owned.userId },
            select: { name: true, handle: true, avatar: true, banner: true }
        });
        return {
            hasBusiness: true,
            role,
            businessId: owned.id,
            isOwner: true,
            onboardingCompleted: !!owned.onboardingCompleted,
            canAccessDashboard: !!owned.onboardingCompleted,
            permissions: getPermissionMap(role),
            businessName: owned.companyName || ownerProfile?.name || null,
            ownerName: ownerProfile?.name || null,
            ownerHandle: ownerProfile?.handle || null,
            ownerAvatar: ownerProfile?.avatar || null,
            ownerBanner: ownerProfile?.banner || null,
            businessLogoUrl: owned.logoUrl || null,
            businessBannerUrl: owned.bannerUrl || null,
            business: owned
        };
    }

    const membership = await prisma.businessMember.findFirst({
        where: { userId },
        include: { business: true }
    });
    if (membership?.business) {
        const role = normalizeTeamRole(membership.role);
        const done = !!membership.business.onboardingCompleted;
        const ownerProfile = await prisma.profile.findUnique({
            where: { userId: membership.business.userId },
            select: { name: true, handle: true, avatar: true, banner: true }
        });
        return {
            hasBusiness: true,
            role,
            businessId: membership.business.id,
            isOwner: false,
            onboardingCompleted: done,
            canAccessDashboard: true,
            permissions: getPermissionMap(role),
            businessName: membership.business.companyName || ownerProfile?.name || null,
            ownerName: ownerProfile?.name || null,
            ownerHandle: ownerProfile?.handle || null,
            ownerAvatar: ownerProfile?.avatar || null,
            ownerBanner: ownerProfile?.banner || null,
            businessLogoUrl: membership.business.logoUrl || null,
            businessBannerUrl: membership.business.bannerUrl || null,
            business: membership.business
        };
    }

    return {
        hasBusiness: false,
        role: null,
        businessId: null,
        isOwner: false,
        onboardingCompleted: false,
        canAccessDashboard: false,
        permissions: getPermissionMap('member'),
        businessName: null,
        ownerName: null,
        ownerHandle: null,
        ownerAvatar: null,
        ownerBanner: null,
        businessLogoUrl: null,
        businessBannerUrl: null,
        business: null
    };
}

async function checkPermission(userId, permissionKey) {
    const access = await getBusinessAccessState(userId);
    const allowed = !!access.permissions?.[permissionKey];
    return { access, allowed };
}

async function logAudit(adminId, action, targetType = null, targetId = null, details = null) {
    try {
        await prisma.auditLog.create({
            data: {
                adminId,
                action,
                targetType,
                targetId,
                details: details ? JSON.stringify(details) : null
            }
        });
    } catch (e) {
        console.warn('[Business RBAC] audit log failed:', e?.message || e);
    }
}

// ——— Access & onboarding (authorize on server; clients use for routing only) ———

router.get('/access', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const access = await getBusinessAccessState(userId);
        const p = access.permissions || {};
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        return res.json({
            hasBusiness: access.hasBusiness,
            role: access.role,
            businessId: access.businessId,
            isOwner: access.isOwner,
            onboardingCompleted: access.onboardingCompleted,
            canAccessDashboard: access.canAccessDashboard,
            businessName: access.businessName,
            ownerName: access.ownerName,
            ownerHandle: access.ownerHandle,
            ownerAvatar: access.ownerAvatar,
            ownerBanner: access.ownerBanner,
            businessLogoUrl: access.businessLogoUrl,
            businessBannerUrl: access.businessBannerUrl,
            canManageTeam: !!p[PERMISSIONS.TEAM_MANAGE],
            canManageAds: !!p[PERMISSIONS.AD_MANAGE],
            canManageProducts: !!p[PERMISSIONS.PRODUCT_MANAGE],
            canViewAnalytics: !!p[PERMISSIONS.VIEW_ANALYTICS],
            canUpdateSettings: !!p[PERMISSIONS.SETTINGS_UPDATE],
            permissions: p
        });
    } catch (err) {
        console.error('[Business GET /access]', err);
        res.status(500).json({ error: 'Failed to resolve business access' });
    }
});

router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { companyName, handle } = req.body || {};
        const name = typeof companyName === 'string' ? companyName.trim() : '';
        if (!name) {
            return res.status(400).json({ error: 'Business name is required' });
        }
        const rawHandle = typeof handle === 'string' ? handle.trim() : '';
        if (!rawHandle) {
            return res.status(400).json({ error: 'Handle is required' });
        }
        const cleanHandle = rawHandle.replace(/^@/, '').toLowerCase();
        if (!/^[a-z0-9_]{1,30}$/.test(cleanHandle)) {
            return res.status(400).json({ error: 'Handle must be 1–30 characters: letters, numbers, underscores' });
        }

        const existingBiz = await prisma.businessProfile.findUnique({ where: { userId } });
        if (existingBiz) {
            return res.status(400).json({ error: 'You already have a business profile' });
        }

        const handleOwner = await prisma.profile.findUnique({ where: { handle: cleanHandle } });
        if (handleOwner && handleOwner.userId !== userId) {
            return res.status(409).json({ error: 'This handle is already taken' });
        }

        const profile = await prisma.$transaction(async (tx) => {
            const created = await tx.businessProfile.create({
                data: {
                    userId,
                    companyName: name,
                    industry: '',
                    status: 'unverified',
                    onboardingCompleted: false
                }
            });
            await tx.businessMember.create({
                data: { businessId: created.id, userId, role: 'admin' }
            });
            const userProfile = await tx.profile.findUnique({ where: { userId } });
            if (userProfile) {
                await tx.profile.update({
                    where: { userId },
                    data: { name, handle: cleanHandle }
                });
            } else {
                await tx.profile.create({
                    data: { userId, name, handle: cleanHandle }
                });
            }
            return created;
        });

        res.status(201).json(profile);
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Handle or profile conflict' });
        }
        console.error('[Business POST /create]', err);
        res.status(500).json({ error: 'Failed to create business' });
    }
});

router.patch('/onboarding/complete', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const owned = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!owned) {
            return res.status(403).json({ error: 'Only the business owner can finish onboarding' });
        }
        const updated = await prisma.businessProfile.update({
            where: { id: owned.id },
            data: { onboardingCompleted: true }
        });
        res.json({ success: true, businessId: updated.id, onboardingCompleted: true });
    } catch (err) {
        console.error('[Business PATCH /onboarding/complete]', err);
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

// GET /:id — business record if caller is owner or member
router.get('/:id', authenticateToken, async (req, res, next) => {
    const { id } = req.params;
    if (!UUID_RE.test(id)) return next('route');
    const reserved = new Set([
        'access', 'create', 'team', 'stats', 'products', 'request-verification',
        'verify-domain', 'boost', 'onboarding'
    ]);
    if (reserved.has(id.toLowerCase())) return next('route');

    try {
        const userId = req.user.userId;
        const business = await prisma.businessProfile.findUnique({
            where: { id },
            include: { adAccounts: true }
        });
        if (!business) return res.status(404).json({ error: 'Business not found' });

        const isOwner = business.userId === userId;
        const member = await prisma.businessMember.findUnique({
            where: { businessId_userId: { businessId: id, userId } }
        });
        if (!isOwner && !member) {
            return res.status(403).json({ error: 'No access to this business' });
        }

        res.json(business);
    } catch (err) {
        console.error('[Business GET /:id]', err);
        res.status(500).json({ error: 'Failed to fetch business' });
    }
});

// GET /: Fetch business profile (owner’s business or one you’re on the team for)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const participant = await resolveParticipantBusiness(userId);
        if (!participant) {
            return res.json(null);
        }

        const profile = await prisma.businessProfile.findUnique({
            where: { id: participant.id },
            include: {
                adAccounts: true
            }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error fetching business profile:', error);
        res.status(500).json({ error: 'Failed to fetch business profile' });
    }
});

// POST /: Create (owner, no business yet) or update (owner or admin member)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { companyName, industry, location, website } = req.body;

        const managed = await resolveManagedBusiness(userId);
        if (managed) {
            const profile = await prisma.businessProfile.update({
                where: { id: managed.id },
                data: {
                    companyName,
                    industry,
                    location,
                    website
                }
            });
            await ensureOwnerIsTeamAdmin(profile.id, profile.userId);
            return res.json(profile);
        }

        const memberOnly = await prisma.businessMember.findFirst({ where: { userId } });
        if (memberOnly) {
            return res.status(403).json({ error: 'Only business admins can update company details' });
        }

        const profile = await prisma.businessProfile.create({
            data: {
                userId,
                companyName: companyName || '',
                industry,
                location,
                website,
                status: 'pending'
            }
        });
        await ensureOwnerIsTeamAdmin(profile.id, userId);

        res.json(profile);
    } catch (error) {
        console.error('Error saving business profile:', error);
        res.status(500).json({ error: 'Failed to save business profile' });
    }
});

// POST /request-verification: Request business profile verification
router.post('/request-verification', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log(`[Business] request-verification called for userId: ${userId}`);

        let profile = await resolveManagedBusiness(userId);

        if (!profile) {
            profile = await prisma.businessProfile.findUnique({ where: { userId } });
        }
        if (!profile) {
            console.log(`[Business] No profile found for userId ${userId} — creating minimal profile`);
            profile = await prisma.businessProfile.create({
                data: {
                    userId,
                    companyName: '',
                    status: 'unverified'
                }
            });
            await ensureOwnerIsTeamAdmin(profile.id, userId);
        }

        const normalizedStatus = (profile.status || '').toLowerCase();

        if (normalizedStatus === 'pending' || normalizedStatus === 'under_review') {
            return res.status(400).json({ error: 'Verification is already in progress' });
        }
        if (normalizedStatus === 'approved' || profile.isVerified) {
            return res.status(400).json({ error: 'Business is already verified' });
        }

        const updated = await prisma.businessProfile.update({
            where: { id: profile.id },
            data: { status: 'PENDING' }
        });

        const existingRequest = await prisma.verificationRequest.findFirst({
            where: { userId, businessId: profile.id, status: 'PENDING' }
        });

        if (!existingRequest) {
            await prisma.verificationRequest.create({
                data: {
                    userId,
                    businessId: profile.id,
                    type: 'BUSINESS',
                    status: 'PENDING'
                }
            }).catch(err => console.error('Could not create verificationRequest record:', err));
        }

        res.json({ success: true, message: 'Verification requested successfully', profile: updated });
    } catch (error) {
        console.error('Error requesting verification:', error);
        res.status(500).json({ error: 'Failed to request verification', details: error.message });
    }
});

// GET /team: Fetch all team members
router.get('/team', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const access = await getBusinessAccessState(userId);
        if (!access.hasBusiness || !access.businessId) {
            return res.status(404).json({ error: 'Business profile not found' });
        }
        const business = await prisma.businessProfile.findUnique({
            where: { id: access.businessId },
            include: {
                members: {
                    include: {
                        user: {
                            include: { profile: { select: require('../constants').PROFILE_SELECT } }
                        }
                    }
                }
            }
        });

        if (!business) return res.status(404).json({ error: 'Business profile not found' });
        res.json(business.members);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// POST /team: Add a team member
router.post('/team', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { identifier, role } = req.body; // identifier can be email or handle

        const { access, allowed } = await checkPermission(userId, PERMISSIONS.INVITE_MEMBER);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: INVITE_MEMBER required' });
        const business = access.business;

        // Find user by email or handle
        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { profile: { handle: identifier.startsWith('@') ? identifier.substring(1) : identifier } }
                ]
            }
        });

        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const member = await prisma.businessMember.create({
            data: {
                businessId: business.id,
                userId: targetUser.id,
                role: normalizeTeamRole(role)
            }
        });

        await logAudit(userId, 'TEAM_MEMBER_INVITED', 'BUSINESS_MEMBER', targetUser.id, {
            businessId: business.id,
            role: member.role
        });

        res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'User is already a member' });
        console.error('Error adding team member:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// PATCH /team/:memberId: Update team member role
router.patch('/team/:memberId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memberId } = req.params;
        const { role } = req.body;

        const { access, allowed } = await checkPermission(userId, PERMISSIONS.ROLE_UPDATE);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: ROLE_UPDATE required' });
        const business = access.business;
        const nextRole = normalizeTeamRole(role);
        if (memberId === business.userId && nextRole !== 'admin') {
            return res.status(400).json({ error: 'Business owner must remain admin' });
        }

        const member = await prisma.businessMember.update({
            where: {
                businessId_userId: {
                    businessId: business.id,
                    userId: memberId
                }
            },
            data: { role: nextRole }
        });

        await logAudit(userId, 'TEAM_ROLE_UPDATED', 'BUSINESS_MEMBER', memberId, {
            businessId: business.id,
            role: nextRole
        });

        res.json(member);
    } catch (error) {
        console.error('Error updating team member role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// DELETE /team/:memberId: Remove a team member
router.delete('/team/:memberId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { memberId } = req.params;

        const { access, allowed } = await checkPermission(userId, PERMISSIONS.REMOVE_MEMBER);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: REMOVE_MEMBER required' });
        const business = access.business;
        if (memberId === business.userId) {
            return res.status(400).json({ error: 'Business owner cannot be removed' });
        }

        try {
            await prisma.businessMember.delete({
                where: {
                    businessId_userId: {
                        businessId: business.id,
                        userId: memberId
                    }
                }
            });
        } catch (delError) {
            if (delError.code === 'P2025') {
                return res.status(404).json({ error: 'Team member not found' });
            }
            throw delError;
        }

        await logAudit(userId, 'TEAM_MEMBER_REMOVED', 'BUSINESS_MEMBER', memberId, {
            businessId: business.id
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// API aliases for clearer RBAC contract
router.post('/team/invite', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { identifier, role } = req.body || {};
        if (!identifier) return res.status(400).json({ error: 'identifier is required' });

        const { access, allowed } = await checkPermission(userId, PERMISSIONS.INVITE_MEMBER);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: INVITE_MEMBER required' });
        const business = access.business;

        const targetUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { profile: { handle: String(identifier).startsWith('@') ? String(identifier).substring(1) : String(identifier) } }
                ]
            }
        });
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        const member = await prisma.businessMember.create({
            data: {
                businessId: business.id,
                userId: targetUser.id,
                role: normalizeTeamRole(role)
            }
        });
        await logAudit(userId, 'TEAM_MEMBER_INVITED', 'BUSINESS_MEMBER', targetUser.id, {
            businessId: business.id,
            role: member.role
        });
        return res.status(201).json(member);
    } catch (error) {
        if (error.code === 'P2002') return res.status(400).json({ error: 'User is already a member' });
        console.error('Error inviting team member:', error);
        return res.status(500).json({ error: 'Failed to invite member' });
    }
});

router.patch('/team/role', authenticateToken, async (req, res) => {
    try {
        const { memberId, role } = req.body || {};
        if (!memberId) return res.status(400).json({ error: 'memberId is required' });
        const userId = req.user.userId;
        const { access, allowed } = await checkPermission(userId, PERMISSIONS.ROLE_UPDATE);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: ROLE_UPDATE required' });
        const business = access.business;
        const nextRole = normalizeTeamRole(role);
        if (memberId === business.userId && nextRole !== 'admin') {
            return res.status(400).json({ error: 'Business owner must remain admin' });
        }
        const member = await prisma.businessMember.update({
            where: { businessId_userId: { businessId: business.id, userId: memberId } },
            data: { role: nextRole }
        });
        await logAudit(userId, 'TEAM_ROLE_UPDATED', 'BUSINESS_MEMBER', memberId, {
            businessId: business.id,
            role: nextRole
        });
        res.json(member);
    } catch (error) {
        console.error('Error updating team member role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

router.delete('/team/member', authenticateToken, async (req, res) => {
    try {
        const memberId = req.query.memberId || req.body?.memberId;
        if (!memberId) return res.status(400).json({ error: 'memberId is required' });
        const userId = req.user.userId;
        const { access, allowed } = await checkPermission(userId, PERMISSIONS.REMOVE_MEMBER);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: REMOVE_MEMBER required' });
        const business = access.business;
        if (memberId === business.userId) {
            return res.status(400).json({ error: 'Business owner cannot be removed' });
        }
        await prisma.businessMember.delete({
            where: { businessId_userId: { businessId: business.id, userId: String(memberId) } }
        });
        await logAudit(userId, 'TEAM_MEMBER_REMOVED', 'BUSINESS_MEMBER', String(memberId), {
            businessId: business.id
        });
        res.json({ success: true });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Team member not found' });
        console.error('Error removing team member:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// GET /stats: Fetch business stats (user-specific)
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { allowed } = await checkPermission(userId, PERMISSIONS.VIEW_ANALYTICS);
        if (!allowed) return res.status(403).json({ error: 'Forbidden: VIEW_ANALYTICS required' });

        // Deterministic resolution: prefer owned business, then membership.
        // `findFirst` with OR can pick an arbitrary member business and produce wrong stats.
        const business = await resolveParticipantBusiness(userId);
        // Stats should reflect the currently signed-in user's real performance.
        const targetUserId = userId;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [followersCount, newFollowers30, postsLast30, topPostsRaw, userProfile, followEvents30, likeEvents30, retweetEvents30, replyEvents30] = await Promise.all([
            prisma.follow.count({ where: { followingId: targetUserId } }),
            prisma.follow.count({ where: { followingId: targetUserId, createdAt: { gte: thirtyDaysAgo } } }),
            prisma.post.findMany({
                where: { userId: targetUserId, replyToId: null, createdAt: { gte: thirtyDaysAgo } },
                include: {
                    _count: { select: { likes: true, retweets: true, replies: true } }
                }
            }),
            prisma.post.findMany({
                where: { userId: targetUserId, replyToId: null },
                include: {
                    _count: { select: { likes: true, retweets: true, replies: true } },
                    media: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: require('../constants').PROFILE_SELECT }
                        }
                    },
                    likes: { select: { id: true, userId: true, createdAt: true } },
                    retweets: { select: { id: true, userId: true, createdAt: true } },
                    bookmarks: { select: { id: true, userId: true, createdAt: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 40
            }),
            prisma.profile.findUnique({
                where: { userId: targetUserId },
                select: { name: true, handle: true, avatar: true, verified: true }
            }),
            prisma.follow.findMany({
                where: { followingId: targetUserId, createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.like.findMany({
                where: { post: { userId: targetUserId }, createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.retweet.findMany({
                where: { post: { userId: targetUserId }, createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.post.findMany({
                where: { replyTo: { userId: targetUserId }, createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            })
        ]);

        let totalEngagement = 0;
        postsLast30.forEach(post => {
            totalEngagement += (post._count.likes + post._count.retweets + post._count.replies);
        });

        const postCount = postsLast30.length;
        const prevFollowers = Math.max(followersCount - newFollowers30, 0);
        const followersGrowth = prevFollowers > 0 ? ((newFollowers30 / prevFollowers) * 100).toFixed(1) : (followersCount > 0 ? '100' : '0');
        const impressions = business?.totalImpressions ? parseInt(business.totalImpressions, 10) : Math.max(totalEngagement * 20, followersCount * 5);
        const prevImpressions = Math.max(Math.floor(impressions * 0.92), 1);
        const impressionsGrowth = (((impressions - prevImpressions) / prevImpressions) * 100).toFixed(1);
        const engagementRate = postCount > 0 && followersCount > 0
            ? ((totalEngagement / (postCount * followersCount)) * 100).toFixed(1)
            : '0';
        const profileVisits = Math.max(Math.floor(followersCount * 0.25), Math.floor(impressions / 15));
        const profileVisitsGrowth = followersCount > 0 ? followersGrowth : '0';

        const formatNumber = (num) => {
            const n = typeof num === 'number' ? num : parseFloat(num);
            if (isNaN(n)) return '0';
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
            return Math.round(n).toString();
        };

        const topPosts = topPostsRaw
            .map((p) => ({
                id: p.id,
                text: p.text,
                createdAt: p.createdAt,
                userId: p.userId,
                user: p.user,
                media: p.media,
                _count: p._count,
                likes: p.likes,
                retweets: p.retweets,
                bookmarks: p.bookmarks,
                engagement: p._count.likes + p._count.retweets + p._count.replies,
                reach: (p._count.likes + p._count.retweets) * 10 + followersCount,
                views: (p._count.likes + p._count.retweets + p._count.replies) * 12
            }))
            .sort((a, b) => b.engagement - a.engagement || (new Date(b.createdAt) - new Date(a.createdAt)))
            .slice(0, 5);

        const byDay = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (29 - i));
            const key = d.toISOString().slice(0, 10);
            byDay[key] = { followers: 0, likes: 0, retweets: 0, replies: 0 };
        }
        followEvents30.forEach((f) => {
            const k = new Date(f.createdAt).toISOString().slice(0, 10);
            if (Object.prototype.hasOwnProperty.call(byDay, k)) byDay[k].followers += 1;
        });
        likeEvents30.forEach((e) => {
            const k = new Date(e.createdAt).toISOString().slice(0, 10);
            if (Object.prototype.hasOwnProperty.call(byDay, k)) byDay[k].likes += 1;
        });
        retweetEvents30.forEach((e) => {
            const k = new Date(e.createdAt).toISOString().slice(0, 10);
            if (Object.prototype.hasOwnProperty.call(byDay, k)) byDay[k].retweets += 1;
        });
        replyEvents30.forEach((e) => {
            const k = new Date(e.createdAt).toISOString().slice(0, 10);
            if (Object.prototype.hasOwnProperty.call(byDay, k)) byDay[k].replies += 1;
        });

        const followerGrowthSeries = Object.entries(byDay).map(([date, counts]) => ({
            date,
            value: counts.followers
        }));

        const likes30 = likeEvents30.length;
        const retweets30 = retweetEvents30.length;
        const replies30 = replyEvents30.length;
        const breakdownTotal = likes30 + retweets30 + replies30;
        const engagementSeries = Object.entries(byDay).map(([date, counts]) => {
            const total = counts.likes + counts.retweets + counts.replies;
            return {
                date,
                likes: counts.likes,
                retweets: counts.retweets,
                replies: counts.replies,
                total
            };
        });
        const engagementBreakdown = {
            total: breakdownTotal,
            likes: likes30,
            retweets: retweets30,
            replies: replies30,
            series: engagementSeries
        };

        res.json({
            followers: formatNumber(followersCount),
            totalFollowers: followersCount,
            followersGrowth,
            impressions: formatNumber(impressions),
            impressionsGrowth,
            engagement: formatNumber(totalEngagement),
            engagementRate,
            engagementTrend: parseFloat(engagementRate) >= 2 ? 'up' : 'down',
            profileVisits: formatNumber(profileVisits),
            profileVisitsGrowth,
            spent: business?.totalSpent || '0',
            followerGrowthSeries,
            engagementBreakdown,
            profileOwner: userProfile || null,
            topPosts
        });
    } catch (error) {
        console.error('Error fetching business stats:', error);
        res.status(500).json({ error: 'Failed to fetch business stats' });
    }
});

// POST /verify-domain: Domain verification (mock or real)
router.post('/verify-domain', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { domain } = req.body || {};
        // In a real scenario: validate domain ownership (e.g. DNS TXT, file, or email)
        const profile = await prisma.businessProfile.findUnique({ where: { userId } });
        if (!profile) {
            return res.status(404).json({ status: false, message: 'Business profile not found', data: null });
        }
        // Mock: accept verification; real impl would check domain
        res.status(200).json({ status: true, message: 'Domain verified successfully', data: { domain: domain || profile.website, verified: true } });
    } catch (error) {
        console.error('Error verifying domain:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to verify domain', data: null });
    }
});

// POST /boost: Mock boost endpoint
router.post('/boost', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { allowed } = await checkPermission(userId, PERMISSIONS.AD_CREATE);
        if (!allowed) return res.status(403).json({ error: 'Forbidden: AD_CREATE required' });
        // Mock success
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.json({ success: true, message: 'Boost activated successfully' });
    } catch (error) {
        console.error('Error boosting post:', error);
        res.status(500).json({ error: 'Failed to boost post' });
    }
});

// GET /:businessId/products: Fetch products for a business
router.get('/:businessId/products', async (req, res) => {
    try {
        const { businessId } = req.params;
        const products = await prisma.product.findMany({
            where: { businessId, active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /:businessId/reviews: Fetch reviews for a business
router.get('/:businessId/reviews', async (req, res) => {
    try {
        const { businessId } = req.params;
        const reviews = await prisma.businessReview.findMany({
            where: { businessId },
            include: { user: { include: { profile: { select: require('../constants').PROFILE_SELECT } } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /:businessId/reviews: Add a review
router.post('/:businessId/reviews', authenticateToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const userId = req.user.userId;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating (1-5)' });
        }

        const review = await prisma.businessReview.create({
            data: { businessId, userId, rating: parseInt(rating), comment },
            include: { user: { include: { profile: { select: require('../constants').PROFILE_SELECT } } } }
        });
        res.status(201).json(review);
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// GET /products: Fetch products for current user's business
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await resolveParticipantBusiness(userId);
        if (!profile) return res.json([]);

        const products = await prisma.product.findMany({
            where: { businessId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        console.error('Fetch My Products Error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /products: Add a new product
router.post('/products', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { access, allowed } = await checkPermission(userId, PERMISSIONS.PRODUCT_MANAGE);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: PRODUCT_MANAGE required' });
        const profile = access.business;

        const { name, description, price, currency, imageUrl, ctaUrl } = req.body;
        const product = await prisma.product.create({
            data: {
                businessId: profile.id,
                name,
                description,
                price: parseFloat(price),
                currency: currency || 'USD',
                imageUrl,
                ctaUrl
            }
        });
        res.status(201).json(product);
    } catch (error) {
        console.error('Add Product Error:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// PUT /products/:id: Update a product
router.put('/products/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { name, description, price, currency, imageUrl, ctaUrl, active } = req.body;

        const { access, allowed } = await checkPermission(userId, PERMISSIONS.PRODUCT_MANAGE);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: PRODUCT_MANAGE required' });
        const managed = access.business;
        const existing = await prisma.product.findFirst({ where: { id, businessId: managed.id } });
        if (!existing) return res.status(404).json({ error: 'Product not found' });
        
        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price: price != null ? parseFloat(price) : undefined,
                currency,
                imageUrl,
                ctaUrl,
                active
            }
        });
        res.json(product);
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /products/:id: Delete a product
router.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { access, allowed } = await checkPermission(userId, PERMISSIONS.PRODUCT_MANAGE);
        if (!allowed || !access.business) return res.status(403).json({ error: 'Forbidden: PRODUCT_MANAGE required' });
        const managed = access.business;
        const existing = await prisma.product.findFirst({ where: { id, businessId: managed.id } });
        if (!existing) return res.status(404).json({ error: 'Product not found' });
        await prisma.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
