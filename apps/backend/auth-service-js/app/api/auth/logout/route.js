const { NextResponse } = require('next/server')
const { prisma } = require('@/lib/prisma')
const { verifyToken } = require('@/lib/jwt')

async function POST(request) {
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

        if (payload.type !== 'refresh') {
            return NextResponse.json(
                { error: 'Invalid token type' },
                { status: 401 }
            )
        }

        // Delete the refresh token
        await prisma.refreshToken.deleteMany({
            where: {
                userId: payload.sub,
                token: token
            }
        })

        return NextResponse.json({ message: 'Logged out successfully' })

    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        )
    }
}

module.exports = { POST }
