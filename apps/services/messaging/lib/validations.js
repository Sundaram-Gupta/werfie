import { z } from 'zod'

export const createConversationSchema = z.object({
    recipientId: z.string().uuid({ message: "Invalid recipient ID" }),
})

export const sendMessageSchema = z.object({
    recipientId: z.string().uuid({ message: "Invalid recipient ID" }),
    content: z.string().optional(),
    type: z.enum(['text', 'image', 'video']).default('text'),
    mediaUrl: z.string().url().optional(),
}).refine(data => data.content || data.mediaUrl, {
    message: "Message must contain either content or media",
    path: ["content"]
})

export const conversationIdSchema = z.object({
    conversationId: z.string().uuid({ message: "Invalid conversation ID" })
})
