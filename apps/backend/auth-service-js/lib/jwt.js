import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'crypto'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-secret'
)

export async function generateAccessToken(userId, email, role = 'USER') {
    const r = typeof role === 'string' && role.trim() ? role.trim() : 'USER'
    const token = await new SignJWT({ sub: userId, email, role: r, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(process.env.ACCESS_TOKEN_EXPIRY || '1h')
        .sign(JWT_SECRET)

    return token
}

export async function generateRefreshToken(userId, email, role = 'USER') {
    const r = typeof role === 'string' && role.trim() ? role.trim() : 'USER'
    const token = await new SignJWT({ sub: userId, email, role: r, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setJti(randomUUID())  // Add unique ID to prevent duplicate tokens
        .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRY || '30d')
        .sign(JWT_SECRET)

    return token
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return {
            sub: payload.sub,
            email: payload.email,
            type: payload.type,
            role: payload.role ? String(payload.role) : 'USER'
        }
    } catch (error) {
        throw new Error('Invalid token')
    }
}
