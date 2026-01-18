import { NextResponse } from 'next/server'
import { withAuth, getUserFromRequest } from '@/lib/auth'
import { TimelineService } from '@/services/timeline.service'

async function handler(request) {
    try {
        const user = getUserFromRequest(request)
        const { searchParams } = new URL(request.url)

        const limit = parseInt(searchParams.get('limit') || '20')
        const offset = parseInt(searchParams.get('offset') || '0')

        const timeline = await TimelineService.getHomeTimeline(user.userId, limit, offset)

        return NextResponse.json(timeline)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export const GET = withAuth(handler)
