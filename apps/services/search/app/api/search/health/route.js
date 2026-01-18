
export async function GET() {
    return new Response(JSON.stringify({ status: 'healthy', service: 'search-service' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}
