import { apiSuccess } from '@/lib/api-response';
export async function GET() {
    return apiSuccess({ status: 'admin-ok', service: 'admin-backend' }, 'Admin service healthy');
}
