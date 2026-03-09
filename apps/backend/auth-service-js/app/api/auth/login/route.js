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

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt
            }
        })

        console.log('[Login] Login successful. Institutional ID:', user.institutionalProfile?.id || 'None');
        return apiSuccess({
            accessToken,
            refreshToken,
            id: user.id,
            email: user.email,
            profile: user.profile,
            institutionType: user.institutionType,
            institutionalProfile: user.institutionalProfile,
            preferredLanguage: user.preferredLanguage
        }, 'Login successful')

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.warn('[Login] Validation error:', error.issues);
            return apiError('Validation error', 400, { details: error.issues })
        }

        console.error('[Login] Internal Error:', error)
        return apiError('Internal server error', 500, { details: error.message })
    }
}
