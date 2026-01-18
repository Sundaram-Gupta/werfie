
export async function GET() {
    return new Response(JSON.stringify({ status: 'healthy', service: 'notification-service' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}
