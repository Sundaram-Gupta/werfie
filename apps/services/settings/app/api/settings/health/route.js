export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({
        status: true,
        message: 'Settings service healthy',
        data: { status: 'healthy', service: 'settings-service' }
    });
}
