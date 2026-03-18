// Verify JWT - try jose first (matches auth), fallback to jsonwebtoken
import { AsyncLocalStorage } from 'async_hooks'
import { jwtVerify } from 'jose'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)

const authContext = new AsyncLocalStorage()

export async function verifyJWT(token) {
    if (!token) throw new Error('No token provided')
    const cleanToken = String(token).trim().replace(/\s+/g, ' ').replace(/^Bearer\s+/i, '')
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
// Trusts x-verified-gateway + x-user-id when set by gateway (gateway verifies JWT before proxying)
// Uses AsyncLocalStorage to pass user - avoids new Request() which causes "Cannot read private member #state" with proxied requests
export function withAuth(handler, options = {}) {
    return async (request, context) => {
        let user = null

        const gatewayVerified = request.headers.get('x-verified-gateway')
        const gatewayUserId = request.headers.get('x-user-id')
        if (gatewayVerified === 'true' && gatewayUserId) {
            user = { userId: gatewayUserId, email: request.headers.get('x-user-email') || '' }
        } else {
            const authHeader = request.headers.get('authorization')
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                if (options.gracefulGet && request.method === 'GET' && request.url?.includes('/conversations')) {
                    return Response.json({ status: true, message: 'OK', data: [] }, { status: 200 })
                }
                return new Response(JSON.stringify({ status: false, message: 'Unauthorized', data: null }), { status: 401, headers: { 'Content-Type': 'application/json' } })
            }
            try {
                user = await verifyJWT(authHeader.split(' ')[1])
            } catch (error) {
                // If a token was provided but is invalid/expired, DO NOT mask it as "200 []".
                // Returning 401 makes Swagger/debugging accurate; the UI can handle 401 by re-login/refresh.
                return new Response(JSON.stringify({ status: false, message: 'Invalid token', data: null }), { status: 401, headers: { 'Content-Type': 'application/json' } })
            }
        }

        return authContext.run(user, () => handler(request, context))
    }
}

// Extract user from request (AsyncLocalStorage first, then headers, then Authorization)
export async function getUserFromRequest(request) {
    const ctx = authContext.getStore()
    if (ctx) return ctx
    const headerUserId = request.headers.get('x-user-id')
    if (headerUserId) return { userId: headerUserId, email: request.headers.get('x-user-email') || '' }
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            return await verifyJWT(authHeader.split(' ')[1])
        } catch { return { userId: null } }
    }
    return { userId: null }
}
