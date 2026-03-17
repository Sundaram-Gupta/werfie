export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
    theme: 'system',
    language: 'en',
    notifications: { email: true, push: true },
    privacy: {
        protectPosts: false,
        protectVideos: false,
        photoTaggingEnabled: true,
        taggingPermission: 'anyone', // 'anyone' | 'followed'
    },
};

/**
 * GET /api/settings - Fetch user settings (requires auth from gateway)
 * Returns default/empty settings if none exist
 */
export async function GET() {
    const data = { ...DEFAULT_SETTINGS };
    return Response.json({
        status: true,
        message: 'Settings fetched',
        data,
    });
}

/**
 * PUT /api/settings - Update user settings
 * Accepts partial settings and returns merged result in standard format
 */
export async function PUT(request) {
    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return Response.json({ status: false, message: 'Invalid JSON body', data: null }, { status: 400 });
        }
        const theme = body.theme ?? DEFAULT_SETTINGS.theme;
        const language = body.language ?? DEFAULT_SETTINGS.language;
        const mutedFilters = body.notifications?.mutedFilters ?? {};
        const notifications = {
            email: body.notifications?.email ?? DEFAULT_SETTINGS.notifications.email,
            push: body.notifications?.push ?? DEFAULT_SETTINGS.notifications.push,
            mutedFilters,
        };
        const privacy = {
            protectPosts: body.privacy?.protectPosts ?? DEFAULT_SETTINGS.privacy.protectPosts,
            protectVideos: body.privacy?.protectVideos ?? DEFAULT_SETTINGS.privacy.protectVideos,
            photoTaggingEnabled: body.privacy?.photoTaggingEnabled ?? DEFAULT_SETTINGS.privacy.photoTaggingEnabled,
            taggingPermission: body.privacy?.taggingPermission ?? DEFAULT_SETTINGS.privacy.taggingPermission,
        };
        const data = { theme, language, notifications, privacy };
        return Response.json({ status: true, message: 'Settings updated', data });
    } catch (err) {
        return Response.json({ status: false, message: err.message || 'Update failed', data: null }, { status: 400 });
    }
}
