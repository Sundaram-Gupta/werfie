export const dynamic = 'force-dynamic';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://127.0.0.1:3002';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const limit = searchParams.get('limit') || '20';
        if (!q) return Response.json({ status: true, message: 'No query', data: [] });
        const url = `${USER_SERVICE_URL}/api/users/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
            return Response.json({ status: true, message: 'Search unavailable', data: [] });
        }
        const users = Array.isArray(data) ? data : (data?.data ?? data?.users ?? []);
        return Response.json({ status: true, message: 'OK', data: users });
    } catch {
        return Response.json({ status: true, message: 'Search unavailable', data: [] });
    }
}
