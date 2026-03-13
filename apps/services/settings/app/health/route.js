export async function GET() {
    return new Response(JSON.stringify({ status: 'healthy', service: 'settings-service' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}
