import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export async function POST(request) {
    try {
        const body = await request.json()
        const { email, password } = loginSchema.parse(body)

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Generate tokens
        const accessToken = await generateAccessToken(user.id, user.email)
        const refreshToken = await generateRefreshToken(user.id, user.email)

        // Store refresh token
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt
            }
        })

        return NextResponse.json({
            accessToken,
            refreshToken,
            id: user.id,
            email: user.email,
            profile: user.profile,
            preferredLanguage: user.preferredLanguage
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
