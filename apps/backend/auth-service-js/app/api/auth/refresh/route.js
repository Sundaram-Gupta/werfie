import { prisma } from '@/lib/prisma'
import { generateAccessToken, verifyToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(request) {
    try {
        let body = {}
        try {
            body = await request.json()
        } catch {
            return apiError('Refresh token required', 400, null)
        }
        const { refreshToken } = body || {}

        if (!refreshToken) {
            return apiError('Refresh token required', 400, null)
        }

        // Verify the refresh token
        const payload = await verifyToken(refreshToken)

        if (payload.type !== 'refresh') {
            return apiError('Invalid token type', 401, null)
        }

        // Check if refresh token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        })

        if (!storedToken) {
            return apiError('Invalid refresh token', 401, null)
        }

        // Check if token is expired
        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({
                where: { id: storedToken.id }
            })
            return apiError('Refresh token expired', 401, null)
        }

        // Generate new access token
        const accessToken = await generateAccessToken(
            payload.sub,
            payload.email,
            payload.role || 'USER'
        )

        return apiSuccess({ accessToken }, 'Token refreshed successfully')

    } catch (error) {
        console.error('Refresh token error:', error)
        return apiError('Invalid refresh token', 401, null)
    }
}
