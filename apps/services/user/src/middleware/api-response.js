/**
 * Standardizes all API responses to:
 * { status: boolean, message: string, data: object|array|null }
 */
function apiResponseMiddleware(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
        if (body && typeof body.status === 'boolean' && 'message' in body && 'data' in body) {
            return originalJson(body);
        }
        if (res.statusCode >= 400 && body && (body.error || body.message)) {
            return originalJson({
                status: false,
                message: body.error || body.message,
                data: body.details ?? null
            });
        }
        return originalJson({
            status: true,
            message: 'Success',
            data: body ?? null
        });
    };
    next();
}

module.exports = apiResponseMiddleware;
