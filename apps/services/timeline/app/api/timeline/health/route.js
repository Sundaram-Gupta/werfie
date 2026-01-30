export async function GET() {
    return new Response(JSON.stringify({
        status: 'healthy',
        service: 'timeline-service',
        timestamp: new Date().toISOString()
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
