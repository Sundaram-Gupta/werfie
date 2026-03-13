import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const limit = parseInt(searchParams.get('limit') || '10')

        const where = category ? { category } : {}

        const trends = await prisma.trend.findMany({
            where,
            orderBy: { posts: 'desc' },
            take: limit,
        })

        return apiSuccess(trends, 'Trends fetched successfully')
    } catch (error) {
        console.error('Error fetching trends:', error)
        return apiError('Failed to fetch trends', 500, null)
    }
}
