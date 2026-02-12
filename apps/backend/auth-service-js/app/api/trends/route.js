import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

        return NextResponse.json(trends)
    } catch (error) {
        console.error('Error fetching trends:', error)
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 })
    }
}
