import { MessagingService } from '../../../../services/messaging.service.js'
import { getUserFromRequest, withAuth } from '../../../../lib/auth.js'
import { apiSuccess, apiError } from '../../../../lib/api-response.js'
import { createConversationSchema } from '../../../../lib/validations.js'
import { PrismaClient } from '@prisma/client'

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export const GET = withAuth(async (request) => {
    try {
        const user = await getUserFromRequest(request)
        const userId = user?.userId

        if (!userId) {
            return apiError('User not authenticated', 401)
        }

        const conversations = await MessagingService.getConversations(userId)

        return apiSuccess(conversations ?? [], 'Conversations fetched successfully')
    } catch (error) {
        console.error('GET /conversations Error:', error?.message || error)
        return apiError('Failed to fetch conversations', 500, {
            details: error?.message || 'Unknown error'
        })
    }
}, { gracefulGet: true })

export const POST = withAuth(async (request) => {
    try {
        console.log('[DEBUG] POST /api/messages/conversations triggered');
        const user = await getUserFromRequest(request);
        const userId = user?.userId;
        if (!userId) {
            return apiError('User not authenticated', 401);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return apiError('Invalid JSON body', 400);
        }
        
        console.log('[DEBUG] POST body:', JSON.stringify(body));
        const result = createConversationSchema.safeParse(body);
        if (!result.success) {
            return apiError('Validation failed', 400, { details: result.error.format() });
        }

        const { recipientId } = result.data;

        // Ensure recipient exists in User table
        const recipientExists = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true }
        });
        if (!recipientExists) {
            return apiError('Recipient user not found', 404);
        }

        let conversation = await MessagingService.findDirectConversation(userId, recipientId);

        if (!conversation) {
            conversation = await MessagingService.createDirectConversation(userId, recipientId);
        }

        return apiSuccess(conversation, 'Conversation created successfully');

    } catch (error) {
        console.error('[DEBUG] POST /conversations Error Stack:', error.stack || error);
        const code = error?.code === 'P2003' ? 400 : 500;
        return apiError('Failed to handle conversation request', code, { details: error?.message });
    }
})
