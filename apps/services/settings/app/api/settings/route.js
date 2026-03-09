export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
    theme: 'system',
    language: 'en',
    notifications: { email: true, push: true },
};

/**
 * GET /api/settings - Fetch user settings (requires auth from gateway)
 * Returns default/empty settings if none exist
 */
export async function GET() {
    return Response.json({
        status: true,
        message: 'Settings fetched',
        data: DEFAULT_SETTINGS,
    });
}

/**
 * PUT /api/settings - Update user settings
 * Accepts partial settings and returns merged result in standard format
 */
export async function PUT(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const theme = body.theme ?? DEFAULT_SETTINGS.theme;
        const language = body.language ?? DEFAULT_SETTINGS.language;
        const notifications = {
            email: body.notifications?.email ?? DEFAULT_SETTINGS.notifications.email,
            push: body.notifications?.push ?? DEFAULT_SETTINGS.notifications.push,
        };
        const data = { theme, language, notifications };
        return Response.json({ status: true, message: 'Settings updated', data });
    } catch (err) {
        return Response.json({ status: false, message: err.message || 'Update failed', data: null }, { status: 400 });
    }
}
