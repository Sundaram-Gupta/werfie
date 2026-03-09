import { NextResponse } from 'next/server';

export function apiSuccess(data: unknown, message = 'Success', statusCode = 200) {
    return NextResponse.json(
        { status: true, message, data: data ?? null },
        { status: statusCode }
    );
}

export function apiError(message: string, statusCode = 400, data: unknown = null) {
    return NextResponse.json(
        { status: false, message, data },
        { status: statusCode }
    );
}
