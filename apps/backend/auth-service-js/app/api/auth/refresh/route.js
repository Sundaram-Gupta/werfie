const { NextResponse } = require('next/server')
const { prisma } = require('@/lib/prisma')
const { generateAccessToken, verifyToken } = require('@/lib/jwt')

async function POST(request) {
    try {
        const body = await request.json()
        const { refreshToken } = body

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token required' },
                { status: 400 }
            )
        }

        // Verify the refresh token
        const payload = await verifyToken(refreshToken)

        if (payload.type !== 'refresh') {
            return NextResponse.json(
                { error: 'Invalid token type' },
                { status: 401 }
            )
        }

        // Check if refresh token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken }
        })

        if (!storedToken) {
            return NextResponse.json(
                { error: 'Invalid refresh token' },
                { status: 401 }
            )
        }

        // Check if token is expired
        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({
                where: { id: storedToken.id }
            })
            return NextResponse.json(
                { error: 'Refresh token expired' },
                { status: 401 }
            )
        }

        // Generate new access token
        const accessToken = await generateAccessToken(payload.sub, payload.email)

        return NextResponse.json({ accessToken })

    } catch (error) {
        console.error('Refresh token error:', error)
        return NextResponse.json(
            { error: 'Invalid refresh token' },
            { status: 401 }
        )
    }
}

module.exports = { POST }
