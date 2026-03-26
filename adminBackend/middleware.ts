import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Must match auth gateway / auth-service-js (`dev-secret` in local PM2 ecosystem).
const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret').trim();

// Define allowed origins securely
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
];

export async function middleware(req: NextRequest) {
    const origin = req.headers.get('origin') ?? '';
    // FOR DEBUGGING: Allow all origins or check explicitly
    const isAllowedOrigin = true; // allowedOrigins.includes(origin);
    console.log(`[Middleware] ${req.method} request to ${req.nextUrl.pathname} from origin: "${origin}". Allowed: ${isAllowedOrigin}`);

    // Default CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-id, x-admin-role, Accept, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
    };

    // Prepare response specifically for OPTIONS (Preflight)
    if (req.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Normal Request Processing
    let response: NextResponse;

    // Skip Auth for public routes or non-api routes
    const path = req.nextUrl.pathname;
    if (!path.startsWith('/api/admin') || path === '/api/admin/login' || path.startsWith('/api/admin/health')) {
        response = NextResponse.next();
    } else {
        // Validation Logic
        const authHeader = req.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            response = NextResponse.json(
                { status: false, message: 'Unauthorized: No token provided', data: null },
                { status: 401 }
            );
        } else {
            const token = authHeader.split(' ')[1];
            try {
                const { payload } = await jwtVerify(
                    token,
                    new TextEncoder().encode(JWT_SECRET)
                );

                const roleRaw = ((payload.role as string) || 'USER').trim();
                const role = roleRaw || 'USER';
                const userId = String(payload.userId || payload.sub || '').trim();

                if (!userId) {
                    response = NextResponse.json(
                        { status: false, message: 'Unauthorized: Invalid token payload', data: null },
                        { status: 401 }
                    );
                } else if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                    response = NextResponse.json(
                        { status: false, message: 'Forbidden: Insufficient permissions (use an ADMIN account accessToken, or POST /api/admin/login)', data: null },
                        { status: 403 }
                    );
                } else {
                    // Success logic
                    const requestHeaders = new Headers(req.headers);
                    requestHeaders.set('x-admin-id', userId);
                    requestHeaders.set('x-admin-role', role);

                    response = NextResponse.next({
                        request: {
                            headers: requestHeaders,
                        },
                    });
                }
            } catch (error) {
                console.error('JWT Verification Error:', error);
                response = NextResponse.json(
                    { status: false, message: 'Unauthorized: Invalid token', data: null },
                    { status: 401 }
                );
            }
        }
    }

    // Apply CORS headers to the final response
    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
    }

    return response;
}

export const config = {
    matcher: ['/api/admin/:path*'],
};
