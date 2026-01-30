import { NextResponse } from 'next/server';

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175'
];

export function middleware(request) {
    const origin = request.headers.get('origin');

    // Handle preflight options request
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });

        if (allowedOrigins.includes(origin) || !origin) {
            response.headers.set('Access-Control-Allow-Origin', origin || '*');
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            response.headers.set('Access-Control-Allow-Credentials', 'true');
        }

        return response;
    }

    const response = NextResponse.next();

    if (allowedOrigins.includes(origin) || !origin) {
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
