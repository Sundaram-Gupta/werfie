import { PrismaClient } from '@prisma/client'
import { getIO } from '../lib/socket.js'

const prisma = new PrismaClient()

export class MessagingService {
    /**
     * Send a direct message
     */
    static async sendMessage({ senderId, recipientId, content }) {
        // 1. Find or create conversation
        let conversation = await this.findDirectConversation(senderId, recipientId)

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    type: 'direct',
                    participants: {
                        create: [
                            { userId: senderId },
                            { userId: recipientId }
                        ]
                    }
                }
            })
        }

        // 2. Create message
        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId,
                content
            }
        })

        // 3. Emit via WebSocket to recipient
        const io = getIO()
        if (io) {
            io.to(`user:${recipientId}`).emit('message', message)
        }

        return message
    }

    static async findDirectConversation(user1, user2) {
        // Simplified query for now
        const participants = await prisma.participant.findMany({
            where: {
                userId: { in: [user1, user2] }
            },
            select: { conversationId: true }
        })

        // Logic to find common conversation ID would go here
        // For MVP, we might just assume if it exists we find it
        return null
    }

    static async getConversations(userId) {
        return prisma.participant.findMany({
            where: { userId },
            include: {
                conversation: {
                    include: {
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        },
                        participants: true
                    }
                }
            }
        })
    }

    static async getMessages(conversationId) {
        return prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        })
    }
}
