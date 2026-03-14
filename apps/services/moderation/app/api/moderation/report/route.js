import { withAuth, getUserFromRequest } from '@/lib/auth'

const corsHeaders = (origin) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
})

async function handler(req) {
    const origin = req.headers.get('origin') || '*'

    const corsResponse = (body, status = 200) => {
        return Response.json(body, { status, headers: corsHeaders(origin) })
    }

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            }
        })
    }

    try {
        const user = getUserFromRequest(req)
        const body = await req.json()
        const { contentType, contentId, reason } = body

        console.log('Moderation Request Debug:', {
            userId: user.userId,
            contentType,
            contentId,
            reason
        })

        if (!contentType || !contentId) {
            return corsResponse({ status: false, message: 'Content type and ID are required', data: null }, 400)
        }

        if (!user.userId) {
            console.error('User ID missing in request headers')
            return corsResponse({ status: false, message: 'Unauthorized: User identity missing from token', data: null }, 401)
        }

        console.log('Attempting to create report in DB...')
        const { prisma } = await import('@/lib/prisma')
        const report = await prisma.report.create({
            data: {
                targetId: contentId,
                targetType: contentType,
                reporterId: user.userId,
                reason: reason || 'Not specified',
                type: 'report'
            }
        })

        console.log('Report Created Successfully:', report.id)

        return corsResponse({
            status: true,
            message: 'Report submitted successfully',
            data: { reportId: report.id }
        })

    } catch (error) {
        console.error('FULL MODERATION ERROR:', error)
        const isClientError = error?.code === 'P2003' || error?.code === 'P2025' || error?.code === 'P2002'
        const status = isClientError ? 400 : 500
        const message = isClientError
            ? (error?.meta?.cause || error?.message || 'Invalid request')
            : 'Failed to submit report. Please try again later.'
        return corsResponse({
            status: false,
            message,
            data: null,
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined
        }, status)
    }
}

async function safeHandler(req, context) {
    try {
        return await handler(req, context)
    } catch (err) {
        console.error('Moderation report safeHandler error:', err)
        const origin = req?.headers?.get?.('origin') || '*'
        return Response.json({
            status: false,
            message: 'Failed to submit report',
            data: null
        }, { status: 500, headers: corsHeaders(origin) })
    }
}

const wrappedPost = withAuth(safeHandler)
export const POST = async (req, context) => {
    try {
        return await wrappedPost(req, context)
    } catch (err) {
        console.error('Moderation POST wrapper error:', err)
        return Response.json({
            status: false,
            message: 'Failed to submit report',
            data: null
        }, { status: 500 })
    }
}
export const OPTIONS = handler // Handle OPTIONS as well
