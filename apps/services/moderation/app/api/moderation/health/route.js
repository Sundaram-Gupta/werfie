export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({
        status: true,
        message: 'Moderation service healthy',
        data: { status: 'healthy', service: 'moderation-service' }
    });
}
