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

// Next.js middleware helper
export function withAuth(handler) {
    return async (request, context) => {
        const authHeader = request.headers.get('authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return Response.json({ status: false, message: 'Unauthorized', data: null }, {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.split(' ')[1]

        try {
            const user = verifyJWT(token)
            console.log('Verified User Payload:', user)

            return handler(request, context)
        } catch (error) {
            console.error('JWT Verification Error:', error.message)
            return Response.json({ status: false, message: 'Invalid token', data: null }, {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    }
}

// Extract user from request
export function getUserFromRequest(request) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return { userId: null, email: null }

    const token = authHeader.split(' ')[1]
    try {
        const user = verifyJWT(token)
        return {
            userId: user.userId || user.sub,
            email: user.email
        }
    } catch (e) {
        return { userId: null, email: null }
    }
}
