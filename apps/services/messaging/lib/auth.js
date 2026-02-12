// JWT Authentication Middleware
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function verifyJWT(token) {
    try {
        if (!token) throw new Error('No token provided')

        // Remove 'Bearer ' prefix if present (common mistake)
        const cleanToken = token.replace('Bearer ', '')

        console.log('Verifying token:', cleanToken.substring(0, 10) + '...', 'Secret:', JWT_SECRET)
        const decoded = jwt.verify(cleanToken, JWT_SECRET)

        // Normalize userId from possible sub or userId fields
        const userId = decoded.userId || decoded.sub || decoded.id
        if (!userId) throw new Error('Token missing userId/sub')

        return { ...decoded, userId }
    } catch (error) {
        console.error('JWT Verification failed:', error.message)
        throw new Error('Invalid token')
    }
}

export function createJWT(payload, expiresIn = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

// Next.js middleware helper
export function withAuth(handler) {
    return async (request, context) => {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.split(' ')[1]

        try {
            const user = verifyJWT(token)

            // Add user to request headers
            const headers = new Headers(request.headers)
            headers.set('x-user-id', user.userId)
            headers.set('x-user-email', user.email)

            // Create new request with user info
            const newRequest = new Request(request, { headers })

            return handler(newRequest, context)
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    }
}

// Extract user from request (checking both middleware headers and direct token)
export function getUserFromRequest(request) {
    // 1. Check for pre-set headers (from gateway/middleware)
    const headerUserId = request.headers.get('x-user-id')
    if (headerUserId) {
        return {
            userId: headerUserId,
            email: request.headers.get('x-user-email')
        }
    }

    // 2. Check for direct Bearer token (for dev/direct access)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1]
        try {
            return verifyJWT(token)
        } catch (error) {
            return { userId: null }
        }
    }

    return { userId: null }
}
