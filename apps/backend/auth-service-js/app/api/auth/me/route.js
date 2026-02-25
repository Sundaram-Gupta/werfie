import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (payload.type !== 'access') {
            return NextResponse.json(
                { error: 'Invalid token type' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                profile: true,
                institutionalProfile: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Exclude password
        const { password, ...userWithoutPassword } = user

        return NextResponse.json(userWithoutPassword)

    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }
}
