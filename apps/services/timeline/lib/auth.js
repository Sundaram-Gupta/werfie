// JWT Authentication Middleware
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded
    } catch (error) {
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
            headers.set('x-user-id', user.userId || user.sub)
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

// Extract user from request
export function getUserFromRequest(request) {
    return {
        userId: request.headers.get('x-user-id'),
        email: request.headers.get('x-user-email')
    }
}
