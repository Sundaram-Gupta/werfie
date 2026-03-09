export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({
        status: true,
        message: 'Search service healthy',
        data: { status: 'healthy', service: 'search-service' }
    });
}
