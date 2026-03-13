import { prisma } from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { apiSuccess, apiError } from '@/lib/api-response'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
})

export async function POST(request) {
    try {
        console.log('[Login] Received login request');
        let body
        try {
            body = await request.json()
        } catch (parseErr) {
            return apiError('Invalid JSON body', 400, null)
        }
        if (!body || typeof body !== 'object') {
            return apiError('Request body required', 400, null)
        }
        console.log('[Login] Parsed body:', { email: body.email, hasPassword: !!body.password });

        const { email, password } = loginSchema.parse(body)

        // Find user - raw query to avoid Prisma schema/DB mismatch
        console.log(`[Login] Looking up user: ${email}`);
        const rows = await prisma.$queryRaw`SELECT id, email, "passwordHash" FROM "User" WHERE email = ${email} LIMIT 1`
        const user = rows[0] || null
        let profile = null
        if (user) {
            try {
                const prof = await prisma.$queryRaw`SELECT * FROM "Profile" WHERE "userId" = ${user.id} LIMIT 1`
                profile = prof[0] || null
            } catch (_) {}
        }

        if (!user) {
            console.log('[Login] User not found');
            return apiError('Invalid credentials', 401, null)
        }

        console.log('[Login] User found, verifying password');

        // Safety check for password hash
        if (!user.passwordHash) {
            console.error('[Login] User has no password hash set!');
            return apiError('Account setup incomplete (no password set)', 400, null)
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash)
        console.log(`[Login] Password valid: ${isValid}`);

        if (!isValid) {
            return apiError('Invalid credentials', 401, null)
        }

        // Generate tokens
        console.log('[Login] Generating tokens');
        const accessToken = await generateAccessToken(user.id, user.email)
        const refreshToken = await generateRefreshToken(user.id, user.email)

        // Store refresh token
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const { randomUUID } = await import('crypto')
        await prisma.$executeRaw`
            INSERT INTO "RefreshToken" (id, "userId", token, "expiresAt", "createdAt")
            VALUES (${randomUUID()}, ${user.id}, ${refreshToken}, ${expiresAt}, NOW())
        `

        console.log('[Login] Login successful');
        return apiSuccess({
            accessToken,
            refreshToken,
            id: user.id,
            email: user.email,
            profile,
            institutionType: null,
            institutionalProfile: null,
            preferredLanguage: 'en'
        }, 'Login successful')

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.warn('[Login] Validation error:', error.issues);
            return apiError('Validation error', 400, { details: error.issues })
        }

        const msg = error?.message || String(error)
        console.error('[Login] Internal Error:', msg)
        const isDev = process.env.NODE_ENV !== 'production'
        return apiError(isDev ? msg : 'Internal server error', 500, isDev ? { error: msg } : null)
    }
}
