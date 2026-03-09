import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    return apiSuccess({ status: 'healthy', service: 'analytics-service' }, 'Analytics service healthy');
}
