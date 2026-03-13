import { withAuth, getUserFromRequest } from '@/lib/auth'
import { TimelineService } from '@/services/timeline.service'
import { apiSuccess, apiError } from '@/lib/api-response'

async function handler(request) {
    try {
        const user = getUserFromRequest(request)
        const { searchParams } = new URL(request.url)

        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')

        const timeline = await TimelineService.getHomeTimeline(user.userId, limit, offset)

        return apiSuccess(timeline, 'Timeline fetched successfully')
    } catch (error) {
        console.error('API Error:', error)
        return apiError('Internal Server Error', 500)
    }
}

export const GET = withAuth(handler)
