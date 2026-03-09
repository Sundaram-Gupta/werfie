import { apiSuccess } from '../../../../lib/api-response.js';

export async function GET() {
    return apiSuccess({ status: 'healthy', service: 'messaging-service' }, 'Messaging service healthy');
}
