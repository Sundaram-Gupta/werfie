import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Missing or invalid authorization header', 401, null)
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        // Accept either access or refresh token; invalidate refresh tokens for this user
        if (payload.type === 'refresh') {
            await prisma.refreshToken.deleteMany({
                where: { userId: payload.sub, token }
            })
        } else {
            // Access token: delete all refresh tokens for this user
            await prisma.refreshToken.deleteMany({
                where: { userId: payload.sub }
            })
        }

        return apiSuccess(null, 'Logged out successfully')

    } catch (error) {
        console.error('Logout error:', error)
        const isAuthError = error?.message === 'Invalid token' || error?.message?.includes('authorization')
        return apiError(isAuthError ? 'Unauthorized' : 'Logout failed', isAuthError ? 401 : 500, null)
    }
}
