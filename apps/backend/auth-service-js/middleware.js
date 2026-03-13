import { NextResponse } from 'next/server';

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
];

// Allow LAN IPs (192.168.x.x, 10.x.x.x) for access via IP e.g. http://192.168.1.37:5173
const isAllowedOrigin = (origin) => {
    if (!origin) return false;
    try {
        const u = new URL(origin);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
        if (u.hostname.startsWith('192.168.') || u.hostname.startsWith('10.')) return true;
        return allowedOrigins.includes(origin);
    } catch { return false; }
};

export function middleware(request) {
    const origin = request.headers.get('origin');
    const allowedOrigin = isAllowedOrigin(origin) ? origin : 'http://localhost:5173';

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });

        response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Max-Age', '86400');

        return response;
    }

    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
