import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, getUserFromRequest } from '@/lib/auth'

async function handler(req) {
    const origin = req.headers.get('origin') || '*'

    // Helper for CORS response
    const corsResponse = (data, status = 200) => {
        return NextResponse.json(data, {
            status,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            }
        })
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
            return corsResponse({ error: 'Content type and ID are required' }, 400)
        }

        if (!user.userId) {
            console.error('User ID missing in request headers')
            return corsResponse({ error: 'Unauthorized: User identity missing from token' }, 401)
        }

        console.log('Attempting to create report in DB...')
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
            success: true,
            message: 'Report submitted successfully',
            reportId: report.id
        })

    } catch (error) {
        console.error('FULL MODERATION ERROR:', error)
        return corsResponse({
            error: 'Failed to submit report',
            details: error.message,
            stack: error.stack
        }, 500)
    }
}

export const POST = withAuth(handler)
export const OPTIONS = handler // Handle OPTIONS as well
