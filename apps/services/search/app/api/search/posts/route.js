export const dynamic = 'force-dynamic';

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://127.0.0.1:3003';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')
        if (!q) return Response.json({ status: true, message: 'No query', data: [] })
        const { SearchService } = await import('@/services/search.service')
        let results = await SearchService.searchPosts(q)

        // Fallback to content-service database search if Elasticsearch is empty/failing
        if (!results || results.length === 0) {
            console.warn('[Search API] ES returned empty, falling back to db search...');
            try {
                const res = await fetch(`${CONTENT_SERVICE_URL}/search?q=${encodeURIComponent(q)}&limit=20`);
                if (res.ok) {
                    const data = await res.json();
                    results = Array.isArray(data) ? data : (data?.data ?? data?.posts ?? []);
                }
            } catch (err) {
                console.error('[Search API] Fallback failed:', err.message);
            }
        }

        return Response.json({ status: true, message: 'OK', data: results ?? [] })
    } catch {
        return Response.json({ status: true, message: 'Search unavailable', data: [] })
    }
}
