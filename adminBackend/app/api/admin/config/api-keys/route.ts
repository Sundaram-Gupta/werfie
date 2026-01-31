/**
 * @swagger
 * /api/admin/config/api-keys:
 *   get:
 *     summary: Get all API keys and stats
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys and platform stats
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               environment:
 *                 type: string
 *               rateLimit:
 *                 type: number
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: API key created
 *       400:
 *         description: Name is required
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';
import crypto from 'crypto';

// GET all API keys
export async function GET(req: NextRequest) {
    try {
        const adminId = req.headers.get('x-admin-id') || 'unknown';
        const [keys, activeCount, revokedCount] = await Promise.all([
            prisma.apiKey.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    keyPrefix: true,
                    environment: true,
                    scopes: true,
                    rateLimit: true,
                    status: true,
                    lastUsedAt: true,
                    expiresAt: true,
                    createdAt: true
                }
            }),
            prisma.apiKey.count({ where: { status: 'active' } }),
            prisma.apiKey.count({ where: { status: 'revoked' } })
        ]);

        return NextResponse.json({
            keys,
            stats: {
                totalActive: activeCount,
                totalRevoked: revokedCount,
                // Mocking these for now as we don't have request logging yet
                totalRequests24h: "1.2M",
                successRate: "99.8%"
            }
        });
    } catch (error: any) {
        console.error('Fetch API Keys Error:', error);
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

// POST create new API key
export async function POST(req: NextRequest) {
    try {
        const adminId = req.headers.get('x-admin-id') || 'unknown';
        const body = await req.json();
        const { name, environment, scopes, rateLimit, expiresAt } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        // Generate a new secure API key
        const rawKey = `wf_${crypto.randomBytes(24).toString('hex')}`;
        const keyPrefix = rawKey.substring(0, 8);
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const newKey = await prisma.apiKey.create({
            data: {
                name,
                keyHash,
                keyPrefix,
                environment: environment || 'dev',
                scopes: scopes || [],
                rateLimit: rateLimit || 100,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                status: 'active'
            }
        });

        await logAdminAction(
            adminId,
            'CREATE_API_KEY',
            'ApiKey',
            newKey.id,
            { name, environment }
        );

        // Return the RAW key only once!
        return NextResponse.json({
            ...newKey,
            keyHash: undefined, // Hide hash
            rawKey: rawKey // RETURN RAW KEY ONLY ONCE
        });

    } catch (error: any) {
        console.error('Create API Key Error:', error);
        return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }
}
