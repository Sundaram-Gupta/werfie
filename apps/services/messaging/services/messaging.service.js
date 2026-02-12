import { PrismaClient } from '@prisma/client'
import { getIO } from '../lib/socket.js'
import { getKafkaProducer } from '../lib/kafka.js'

let prisma

if (!global.prisma) {
    global.prisma = new PrismaClient()
}
prisma = global.prisma;

export class MessagingService {
    /**
     * Send a message to a specific conversation
     */
    static async sendMessageToConversation({ conversationId, senderId, content, type = 'text', mediaUrl, thumbnailUrl, duration, size, mimeType }) {
        // 1. Validate participation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: true }
        })

        if (!conversation) throw new Error("Conversation not found")

        const isParticipant = conversation.participants.some(p => p.userId === senderId)
        if (!isParticipant) throw new Error("User is not a participant of this conversation")

        // 2. Create message
        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId,
                content,
                type,
                mediaUrl,
                thumbnailUrl,
                duration,
                size,
                mimeType,
                status: 'sent'
            },
            include: {
                conversation: {
                    select: { participants: true }
                }
            }
        })

        // 3. Update Conversation Metadata
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                lastMessageAt: new Date(),
                lastMessageId: message.id
            }
        })

        // 4. Emit Real-time Events
        const io = getIO()
        if (io) {
            // Emit to the conversation room (covers all active participants)
            io.to(`conversation:${conversationId}`).emit('receive_message', message)

            // Emit notifications to offline/inactive participants
            conversation.participants.forEach(p => {
                if (p.userId !== senderId) {
                    io.to(`user:${p.userId}`).emit('new_message_notification', message)
                }
            })
        }

        // 5. Produce Kafka Event for Notification Service
        try {
            const kafkaProducer = getKafkaProducer()
            const recipientIds = conversation.participants
                .filter(p => p.userId !== senderId)
                .map(p => p.userId)

            for (const recipientId of recipientIds) {
                await kafkaProducer.send('MESSAGE_SENT', {
                    messageId: message.id,
                    senderId,
                    recipientId,
                    conversationId,
                    content: message.content,
                    type: message.type
                })
            }
        } catch (kafkaError) {
            console.error('❌ Failed to produce Kafka event:', kafkaError)
        }

        return message
    }

    /**
     * Send a direct message (Finds or Creates Conversation)
     */
    static async sendMessage({ senderId, recipientId, content, type = 'text', mediaUrl, thumbnailUrl, duration, size, mimeType }) {
        let conversation = await this.findDirectConversation(senderId, recipientId)

        if (!conversation) {
            conversation = await this.createDirectConversation(senderId, recipientId)
        }

        return this.sendMessageToConversation({
            conversationId: conversation.id,
            senderId,
            content,
            type,
            mediaUrl,
            thumbnailUrl,
            duration,
            size,
            mimeType
        })
    }

    static async createDirectConversation(user1, user2) {
        return prisma.conversation.create({
            data: {
                type: 'direct',
                participants: {
                    create: [
                        { userId: user1 },
                        { userId: user2 }
                    ]
                }
            },
            include: {
                participants: true,
                messages: { take: 1 }
            }
        })
    }

    static async findDirectConversation(user1, user2) {
        if (user1 === user2) return null;

        return prisma.conversation.findFirst({
            where: {
                type: 'direct',
                AND: [
                    { participants: { some: { userId: user1 } } },
                    { participants: { some: { userId: user2 } } }
                ]
            },
            include: {
                participants: true
            }
        })
    }

    static async getConversations(userId) {
        try {
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
                    lastMessage: true
                }
            })
            return conversations
        } catch (error) {
            console.error(`getConversations Error for userId ${userId}:`, error)
            throw error
        }
    }

    static async getConversation(conversationId, userId) {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: true,
                lastMessage: true
            }
        })

        if (!conversation) return null

        const isParticipant = conversation.participants.some(p => p.userId === userId)
        if (!isParticipant) throw new Error("Unauthorized to view this conversation")

        return conversation
    }

    static async getMessages(conversationId) {
        return prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' }
        })
    }
}
