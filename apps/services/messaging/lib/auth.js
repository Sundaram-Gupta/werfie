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
        console.log(`[MessagingService] Verifying token: ${cleanToken.substring(0, 20)}...`)
        console.log(`[MessagingService] Using JWT_SECRET: ${JWT_SECRET}`)
        const { payload } = await jwtVerify(cleanToken, JWT_SECRET_BYTES)
        const userId = payload.userId || payload.sub || payload.id
        if (!userId) throw new Error('Token missing userId/sub')
        console.log(`[MessagingService] jose verified token for userId: ${userId}`)
        return { ...payload, userId }
    } catch (joseError) {
        console.warn(`[MessagingService] jose verification failed: ${joseError.message}. Falling back to jsonwebtoken.`)
        try {
            const decoded = jwt.verify(cleanToken, JWT_SECRET)
            const userId = decoded.userId || decoded.sub || decoded.id
            if (!userId) throw new Error('Token missing userId/sub')
            console.log(`[MessagingService] jsonwebtoken verified token for userId: ${userId}`)
            return { ...decoded, userId }
        } catch (e) {
            console.error('[MessagingService] JWT Verification failed globally:', e?.message)
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

        const getHeader = (name) => {
            if (typeof request.headers.get === 'function') return request.headers.get(name);
            return request.headers[name] || request.headers[name.toLowerCase()];
        };

        const gatewayVerified = getHeader('x-verified-gateway');
        const gatewayUserId = getHeader('x-user-id');
        if (gatewayVerified === 'true' && gatewayUserId) {
            user = { userId: gatewayUserId, email: getHeader('x-user-email') || '' };
        } else {
            const authHeader = getHeader('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                if (options.gracefulGet && request.method === 'GET' && request.url?.includes('/conversations')) {
                    if (typeof Response !== 'undefined') {
                        return Response.json({ status: true, message: 'OK', data: [] }, { status: 200 });
                    }
                }
                const errorBody = JSON.stringify({ status: false, message: 'Unauthorized', data: null });
                if (typeof Response !== 'undefined') {
                    return new Response(errorBody, { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                return { status: 401, error: 'Unauthorized' };
            }
            try {
                user = await verifyJWT(authHeader.split(' ')[1]);
            } catch (error) {
                const errorBody = JSON.stringify({ status: false, message: 'Invalid token', data: null });
                if (typeof Response !== 'undefined') {
                    return new Response(errorBody, { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                return { status: 401, error: 'Invalid token' };
            }
        }

        return authContext.run(user, () => handler(request, context))
    }
}

// Extract user from request (AsyncLocalStorage first, then headers, then Authorization)
export async function getUserFromRequest(request) {
    const ctx = authContext.getStore()
    if (ctx) return ctx
    const getHeader = (name) => {
        if (typeof request.headers.get === 'function') return request.headers.get(name);
        return request.headers[name] || request.headers[name.toLowerCase()];
    };

    const headerUserId = getHeader('x-user-id');
    if (headerUserId) return { userId: headerUserId, email: getHeader('x-user-email') || '' };
    const authHeader = getHeader('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            return await verifyJWT(authHeader.split(' ')[1]);
        } catch { return { userId: null }; }
    }
    return { userId: null };
}
