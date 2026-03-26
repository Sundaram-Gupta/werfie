import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/api-response';
import { randomUUID } from 'crypto';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status, adminNotes, badgeType } = await request.json();

        if (!['approved', 'rejected', 'under_review', 'pending'].includes(status)) {
            return apiError('Invalid status', 400);
        }

        const profile = await prisma.institutionalProfile.update({
            where: { id },
            data: {
                status,
                adminNotes,
                badgeType,
                isVerified: status === 'approved'
            }
        });

        // Sync to Profile and User
        if (status === 'approved') {
            await Promise.all([
                prisma.profile.update({
                    where: { userId: profile.userId },
                    data: { verified: true }
                }),
                prisma.user.update({
                    where: { id: profile.userId },
                    data: { institutionType: profile.institutionType }
                })
            ]);

            // World Leaders connection:
            // When an institutional request is approved, create/update a corresponding WorldLeader row
            // so the user-facing /world-leaders page can show it.
            const institutionId = profile.id;
            const leaderName = profile.publicDisplayName || profile.institutionName;
            const title = profile.badgeType || profile.institutionType || 'Official Institution';
            const profileImage = profile.logoUrl ?? null;
            const region = profile.state || 'Global';
            const country = profile.country || 'Unknown';

            const existing = await prisma.$queryRaw<{ id: string }[]>`
                SELECT "id" FROM "WorldLeader" WHERE "institutionId" = ${institutionId} LIMIT 1
            `;

            if (Array.isArray(existing) && existing[0]?.id) {
                await prisma.$executeRaw`
                    UPDATE "WorldLeader"
                    SET
                        "leaderName" = ${leaderName},
                        "title" = ${title},
                        "profileImage" = ${profileImage},
                        "region" = ${region},
                        "country" = ${country},
                        "priorityRank" = 0,
                        "autoPushEnabled" = false,
                        "verifiedStatus" = true,
                        "updatedAt" = CURRENT_TIMESTAMP
                    WHERE "institutionId" = ${institutionId}
                `;
            } else {
                await prisma.$executeRaw`
                    INSERT INTO "WorldLeader" (
                        "id",
                        "institutionId",
                        "leaderName",
                        "title",
                        "profileImage",
                        "region",
                        "country",
                        "priorityRank",
                        "autoPushEnabled",
                        "verifiedStatus"
                    ) VALUES (
                        ${randomUUID()},
                        ${institutionId},
                        ${leaderName},
                        ${title},
                        ${profileImage},
                        ${region},
                        ${country},
                        0,
                        false,
                        true
                    )
                `;
            }
        } else if (status === 'rejected') {
            await prisma.profile.update({
                where: { userId: profile.userId },
                data: { verified: false }
            });

            // If rejected, hide from World Leaders feed.
            await prisma.$executeRaw`
                UPDATE "WorldLeader"
                SET "verifiedStatus" = false,
                    "updatedAt" = CURRENT_TIMESTAMP
                WHERE "institutionId" = ${profile.id}
            `;
        }

        return apiSuccess(profile, 'Institutional profile updated successfully');
    } catch (error: any) {
        console.error('[Institutional Review] Error:', error);
        return apiError('Internal server error', 500, { details: error.message });
    }
}
