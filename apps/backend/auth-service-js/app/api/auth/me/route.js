import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
        const token = (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer '))
            ? authHeader.substring(7).trim()
            : null

        if (!token) {
            return apiError('Missing or invalid authorization header', 401, null)
        }

        const payload = await verifyToken(token)

        if (payload.type !== 'access') {
            return apiError('Invalid token type', 401, null)
        }

        // Use raw query to avoid Prisma schema/DB column mismatches
        let rows
        try {
            rows = await prisma.$queryRaw`
                SELECT u.id, u.email, u."createdAt", u."updatedAt",
                       p.id as "profileId", p.name, p.handle, p.bio, p.avatar, p.banner, p.verified
                FROM "User" u
                LEFT JOIN "Profile" p ON p."userId" = u.id
                WHERE u.id = ${payload.sub}
                LIMIT 1
            `
        } catch (qErr) {
            // Fallback if Profile table or join fails
            rows = await prisma.$queryRaw`
                SELECT id, email, "createdAt", "updatedAt" FROM "User" WHERE id = ${payload.sub} LIMIT 1
            `
        }
        const row = rows[0]

        if (!row) {
            return apiError('User not found', 404, null)
        }

        const user = {
            id: row.id,
            email: row.email,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            role: row.role || 'USER',
            status: row.status || 'ACTIVE',
            preferredLanguage: row.preferredLanguage || 'en',
            profile: row.profileId ? {
                id: row.profileId,
                name: row.name,
                handle: row.handle,
                bio: row.bio,
                avatar: row.avatar,
                banner: row.banner,
                verified: row.verified
            } : null
        }

        return apiSuccess(user, 'User retrieved successfully')

    } catch (error) {
        console.error('Get user error:', error)
        const msg = error?.message || ''
        const isAuthError = msg.includes('token') || msg.includes('expired') || msg.includes('jwt') || msg.includes('JWT')
        return apiError(isAuthError ? 'Unauthorized' : 'Internal server error', isAuthError ? 401 : 500, null)
    }
}
