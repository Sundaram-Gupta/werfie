export const dynamic = 'force-dynamic';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    return apiSuccess({
        status: 'healthy',
        service: 'timeline-service',
        timestamp: new Date().toISOString()
    }, 'Timeline service healthy');
}
