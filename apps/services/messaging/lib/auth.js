// Verify JWT - try jose first (matches auth), fallback to jsonwebtoken
import { jwtVerify } from 'jose'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)

export async function verifyJWT(token) {
    if (!token) throw new Error('No token provided')
    const cleanToken = token.replace(/^Bearer\s+/i, '')
    try {
        const { payload } = await jwtVerify(cleanToken, JWT_SECRET_BYTES)
        const userId = payload.userId || payload.sub || payload.id
        if (!userId) throw new Error('Token missing userId/sub')
        return { ...payload, userId }
    } catch {
        try {
            const decoded = jwt.verify(cleanToken, JWT_SECRET)
            const userId = decoded.userId || decoded.sub || decoded.id
            if (!userId) throw new Error('Token missing userId/sub')
            return { ...decoded, userId }
        } catch (e) {
            console.error('JWT Verification failed:', e?.message)
            throw new Error('Invalid token')
        }
    }
}

export async function createJWT(payload, expiresIn = '7d') {
    const { SignJWT } = await import('jose')
    return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(expiresIn).sign(JWT_SECRET_BYTES)
}

// Next.js middleware helper - optionalGraceful: return 200 with empty when auth fails (for GET conversations)
export function withAuth(handler, options = {}) {
    return async (request, context) => {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            if (options.gracefulGet && request.method === 'GET' && request.url?.includes('/conversations')) {
                return Response.json({ status: true, message: 'OK', data: [] }, { status: 200 })
            }
            return new Response(JSON.stringify({ status: false, message: 'Unauthorized', data: null }), { status: 401, headers: { 'Content-Type': 'application/json' } })
        }
        const token = authHeader.split(' ')[1]
        try {
            const user = await verifyJWT(token)
            const headers = new Headers(request.headers)
            headers.set('x-user-id', user.userId)
            headers.set('x-user-email', user.email)
            const newRequest = new Request(request, { headers })
            return handler(newRequest, context)
        } catch (error) {
            if (options.gracefulGet && request.method === 'GET' && request.url?.includes('/conversations')) {
                return Response.json({ status: true, message: 'OK', data: [] }, { status: 200 })
            }
            return new Response(JSON.stringify({ status: false, message: 'Invalid token', data: null }), { status: 401, headers: { 'Content-Type': 'application/json' } })
        }
    }
}

// Extract user from request (checking both middleware headers and direct token)
export async function getUserFromRequest(request) {
    const headerUserId = request.headers.get('x-user-id')
    if (headerUserId) return { userId: headerUserId, email: request.headers.get('x-user-email') }
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            return await verifyJWT(authHeader.split(' ')[1])
        } catch { return { userId: null } }
    }
    return { userId: null }
}
