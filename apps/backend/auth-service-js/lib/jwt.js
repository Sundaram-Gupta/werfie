import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'crypto'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-secret'
)

export async function generateAccessToken(userId, email) {
    const token = await new SignJWT({ sub: userId, email, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_ACCESS_EXPIRY || '15m')
        .sign(JWT_SECRET)

    return token
}

export async function generateRefreshToken(userId, email) {
    const token = await new SignJWT({ sub: userId, email, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setJti(randomUUID())  // Add unique ID to prevent duplicate tokens
        .setExpirationTime(process.env.JWT_REFRESH_EXPIRY || '7d')
        .sign(JWT_SECRET)

    return token
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return {
            sub: payload.sub,
            email: payload.email,
            type: payload.type
        }
    } catch (error) {
        throw new Error('Invalid token')
    }
}
