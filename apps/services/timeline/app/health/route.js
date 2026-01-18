export async function GET() {
    return new Response(JSON.stringify({ status: 'healthy', service: 'timeline-service' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
