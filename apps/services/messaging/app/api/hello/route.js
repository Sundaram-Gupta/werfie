
export async function GET() {
    return new Response(JSON.stringify({ status: 'hello-ok' }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
