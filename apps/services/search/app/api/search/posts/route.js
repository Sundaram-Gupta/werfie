export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')
        if (!q) return Response.json({ status: true, message: 'No query', data: [] })
        const { SearchService } = await import('@/services/search.service')
        const results = await SearchService.searchPosts(q)
        return Response.json({ status: true, message: 'OK', data: results ?? [] })
    } catch {
        return Response.json({ status: true, message: 'Search unavailable', data: [] })
    }
}
