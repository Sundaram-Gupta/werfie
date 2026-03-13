import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    return apiSuccess({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    }, 'Service healthy');
}
