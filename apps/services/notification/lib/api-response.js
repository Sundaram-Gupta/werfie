export function apiSuccess(data, message = 'Success', statusCode = 200) {
    // Use the standard Web `Response` so we don't depend on NextResponse internals.
    return new Response(
        JSON.stringify({ status: true, message, data: data ?? null }),
        {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

export function apiError(message, statusCode = 400, data = null) {
    return new Response(
        JSON.stringify({ status: false, message, data }),
        {
            status: statusCode,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
