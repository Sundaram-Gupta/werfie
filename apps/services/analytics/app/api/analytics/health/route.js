
export async function GET() {
    return new Response(JSON.stringify({ status: 'healthy', service: 'analytics-service' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}
