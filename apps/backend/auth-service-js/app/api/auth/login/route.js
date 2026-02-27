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
        console.log('[Login] Received login request');
        const body = await request.json()
        console.log('[Login] Parsed body:', { email: body.email, hasPassword: !!body.password });

        const { email, password } = loginSchema.parse(body)

        // Find user
        console.log(`[Login] Looking up user: ${email}`);
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                profile: true,
                institutionalProfile: true
            }
        })

        if (!user) {
            console.log('[Login] User not found');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        console.log('[Login] User found, verifying password');

        // Safety check for password hash
        if (!user.passwordHash) {
            console.error('[Login] User has no password hash set!');
            return NextResponse.json(
                { error: 'Account setup incomplete (no password set)' },
                { status: 400 }
            )
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash)
        console.log(`[Login] Password valid: ${isValid}`);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Generate tokens
        console.log('[Login] Generating tokens');
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

        console.log('[Login] Login successful. Institutional ID:', user.institutionalProfile?.id || 'None');
        return NextResponse.json({
            accessToken,
            refreshToken,
            id: user.id,
            email: user.email,
            profile: user.profile,
            institutionType: user.institutionType,
            institutionalProfile: user.institutionalProfile,
            preferredLanguage: user.preferredLanguage
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.warn('[Login] Validation error:', error.issues);
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('[Login] Internal Error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message }, // Exposed details for debugging
            { status: 500 }
        )
    }
}
