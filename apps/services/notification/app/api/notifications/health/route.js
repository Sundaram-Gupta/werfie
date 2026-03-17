export const dynamic = 'force-dynamic';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    return apiSuccess({ status: 'healthy', service: 'notification-service' }, 'Notification service healthy');
}
