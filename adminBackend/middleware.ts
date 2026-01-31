import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here_secure_it';

export async function middleware(req: NextRequest) {
    // 1. Handle CORS
    const origin = req.headers.get('origin') || '*';
    const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-id, x-admin-role',
        'Access-Control-Allow-Credentials': 'true',
    };

    // Handle Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return NextResponse.json({}, { headers: corsHeaders });
    }

    // Only protect /api/admin routes
    if (!req.nextUrl.pathname.startsWith('/api/admin')) {
        return NextResponse.next({ headers: corsHeaders });
    }

    // Explicitly allow public access to login route
    if (req.nextUrl.pathname === '/api/admin/login') {
        const response = NextResponse.next();
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized: No token provided' },
            { status: 401, headers: corsHeaders }
        );
    }

    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(JWT_SECRET)
        );

        const role = (payload.role as string) || 'USER';

        // Enforce Admin Role
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Insufficient permissions' },
                { status: 403, headers: corsHeaders }
            );
        }

        // Add user info to headers for downstream access if needed
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-admin-id', payload.userId as string);
        requestHeaders.set('x-admin-role', role);

        const response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });

        // Append CORS headers to normal response
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;

    } catch (error) {
        console.error('JWT Verification Error:', error);
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Invalid token' },
            { status: 401, headers: corsHeaders }
        );
    }
}

export const config = {
    matcher: '/api/admin/:path*',
};
