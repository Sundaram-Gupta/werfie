import { PrismaClient } from '@prisma/client'
import { getIO } from '../lib/socket.js'

let prisma

if (!global.prisma) {
    global.prisma = new PrismaClient()
}
prisma = global.prisma

export class MessagingService {
    /**
     * Send a direct message
     */
    static async sendMessage({ senderId, recipientId, content, type = 'text', mediaUrl }) {
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
                content,
                type,
                mediaUrl,
                status: 'sent'
            }
        })

        // 3. Update Conversation Last Message
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                lastMessageAt: new Date(),
                lastMessageId: message.id
            }
        })

        // 4. Emit via WebSocket to recipient
        const io = getIO()
        if (io) {
            io.to(`user:${recipientId}`).emit('receive_message', message)
            // also emit to sender for consistency across devices
            io.to(`user:${senderId}`).emit('receive_message', message)
        }

        return message
    }

    static async findDirectConversation(user1, user2) {
        // Find conversation where both users are participants
        // This is a bit tricky with Prisma without raw SQL for strict matching, 
        // but for 1:1 we can find conversations with user1, then filter for user2

        const conversations = await prisma.conversation.findMany({
            where: {
                type: 'direct',
                participants: {
                    some: { userId: user1 }
                }
            },
            include: {
                participants: true
            }
        })

        return conversations.find(c =>
            c.participants.some(p => p.userId === user2)
        )
    }

    static async getConversations(userId) {
        // Get conversations for user, sorted by last message
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId }
                }
            },
            orderBy: {
                lastMessageAt: 'desc'
            },
            include: {
                participants: true,
                lastMessage: true // Include the actual message object
            }
        })

        return conversations
    }

    static async getMessages(conversationId) {
        return prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        })
    }
}
