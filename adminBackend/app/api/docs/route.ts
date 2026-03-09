import { getApiDocs } from '@/lib/swagger';
import { apiSuccess } from '@/lib/api-response';

export async function GET() {
    const spec = getApiDocs();
    return apiSuccess(spec, 'API docs fetched successfully');
}
