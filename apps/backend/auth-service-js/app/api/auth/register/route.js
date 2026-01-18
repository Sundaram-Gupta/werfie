const { NextResponse } = require('next/server')
const { prisma } = require('@/lib/prisma')
const { generateAccessToken, generateRefreshToken } = require('@/lib/jwt')
const bcrypt = require('bcrypt')
const { z } = require('zod')

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    handle: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/)
})

async function POST(request) {
    try {
        const body = await request.json()
        const { email, password, name, handle } = registerSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create user with profile
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                profile: {
                    create: {
                        name,
                        handle
                    }
                }
            },
            include: {
                profile: true
            }
        })

        // Generate tokens
        const accessToken = await generateAccessToken(user.id, user.email)
        const refreshToken = await generateRefreshToken(user.id, user.email)

        // Store refresh token
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt
            }
        })

        // TODO: Publish user.registered event with name and handle
        console.log('Event: user.registered', { userId: user.id, email, name, handle })

        return NextResponse.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email
            }
        }, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

module.exports = { POST }
