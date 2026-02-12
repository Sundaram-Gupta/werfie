import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAdminAction } from '@/lib/audit';
import crypto from 'crypto';

type Params = {
    params: Promise<{ id: string }>
}

// PATCH - Update key (status, name, etc) or Rotate if requested
export async function PATCH(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const adminId = req.headers.get('x-admin-id') || 'unknown';
        const body = await req.json();
        const { name, status, rateLimit, scopes, rotate } = body;

        if (rotate) {
            // Regeneration logic
            const rawKey = `wf_${crypto.randomBytes(24).toString('hex')}`;
            const keyPrefix = rawKey.substring(0, 8);
            const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

            const updatedKey = await prisma.apiKey.update({
                where: { id },
                data: {
                    keyHash,
                    keyPrefix,
                    updatedAt: new Date()
                }
            });

            await logAdminAction(adminId, 'ROTATE_API_KEY', 'ApiKey', id);

            return NextResponse.json({
                success: true,
                message: 'Key rotated successfully',
                rawKey // Return new key
            });
        }

        const updatedKey = await prisma.apiKey.update({
            where: { id },
            data: {
                name,
                status,
                rateLimit,
                scopes
            }
        });

        await logAdminAction(adminId, 'UPDATE_API_KEY', 'ApiKey', id, { status, name });

        return NextResponse.json({ success: true, key: updatedKey });

    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
    }
}

// DELETE - Revoke key
export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const adminId = req.headers.get('x-admin-id') || 'unknown';

        await prisma.apiKey.delete({
            where: { id }
        });

        await logAdminAction(adminId, 'REVOKE_API_KEY', 'ApiKey', id);

        return NextResponse.json({ success: true, message: 'Key revoked successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }
}
