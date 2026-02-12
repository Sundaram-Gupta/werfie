import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    });
}
