import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    handle: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
    preferredLanguage: z.string().optional()
})

export async function POST(request) {
    try {
        const body = await request.json()
        if (body.handle && typeof body.handle === 'string') {
            body.handle = body.handle.replace(/^@+/, '')
        }
        const { email, password, name, handle, preferredLanguage } = registerSchema.parse(body)

        // Check if email or handle already exists
        const [existingEmail, existingHandle] = await Promise.all([
            prisma.user.findUnique({ where: { email } }),
            prisma.profile.findUnique({ where: { handle } })
        ])

        if (existingEmail) {
            return apiError('Email already exists', 400, null)
        }

        if (existingHandle) {
            return apiError('Handle already taken', 400, null)
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create user with profile
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                preferredLanguage: preferredLanguage || 'en',
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

        return apiSuccess({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email
            }
        }, 'Registration successful', 201)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return apiError('Validation error', 400, { details: error.issues })
        }

        console.error('Registration error:', error)
        if (error.stack) console.error(error.stack)
        return apiError('Internal server error', 500, { details: error.message })
    }
}
