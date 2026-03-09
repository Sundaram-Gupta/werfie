import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return apiError('Missing or invalid authorization header', 401, null)
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (payload.type !== 'access') {
            return apiError('Invalid token type', 401, null)
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                profile: true,
                institutionalProfile: true
            }
        })

        if (!user) {
            return apiError('User not found', 404, null)
        }

        // Exclude password
        const { passwordHash, ...userWithoutPassword } = user

        return apiSuccess(userWithoutPassword, 'User retrieved successfully')

    } catch (error) {
        console.error('Get user error:', error)
        return apiError('Unauthorized', 401, null)
    }
}
