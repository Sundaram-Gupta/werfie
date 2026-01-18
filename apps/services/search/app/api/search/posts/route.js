// Basic Next.js API Routes (Simplified)
import { NextResponse } from 'next/server'
import { SearchService } from '@/services/search.service'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) {
        return NextResponse.json([])
    }

    const results = await SearchService.searchPosts(q)
    return NextResponse.json(results)
}
