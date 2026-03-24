import { PrismaClient } from '@prisma/client'
import { getIO } from '../lib/socket.js'
import { getKafkaProducer } from '../lib/kafka.js'

let prisma

if (!global.prisma) {
    global.prisma = new PrismaClient()
}
prisma = global.prisma;

export class MessagingService {
    static _conversationSettingsTableAvailable = true

    static hasConversationSettingsModel() {
        return Boolean(prisma?.conversationUserSetting) && this._conversationSettingsTableAvailable
    }

    static markConversationSettingsUnavailable(error) {
        // P2021 = table does not exist. Disable settings queries for this process.
        if (error?.code === 'P2021') {
            this._conversationSettingsTableAvailable = false
            console.warn('[MessagingService] ConversationUserSetting table unavailable; using fallback behavior.')
        }
    }

    static async ensureParticipant(conversationId, userId) {
        const participant = await prisma.participant.findFirst({
            where: { conversationId, userId },
            select: { id: true }
        })
        if (!participant) throw new Error("Unauthorized to access this conversation")
    }

    static async getConversationSettings(conversationId, userId) {
        await this.ensureParticipant(conversationId, userId)
        if (!this.hasConversationSettingsModel()) {
            return {
                conversationId,
                userId,
                disappearingMode: 'off',
                blockScreenshots: false,
                blockMessages: false
            }
        }
        try {
            return await prisma.conversationUserSetting.upsert({
                where: { conversationId_userId: { conversationId, userId } },
                update: {},
                create: { conversationId, userId }
            })
        } catch (error) {
            this.markConversationSettingsUnavailable(error)
            return {
                conversationId,
                userId,
                disappearingMode: 'off',
                blockScreenshots: false,
                blockMessages: false
            }
        }
    }

    static async updateConversationSettings(conversationId, userId, updates = {}) {
        await this.ensureParticipant(conversationId, userId)
        const next = {}
        if (typeof updates.disappearingMode === 'string') next.disappearingMode = updates.disappearingMode
        if (typeof updates.blockScreenshots === 'boolean') next.blockScreenshots = updates.blockScreenshots
        if (typeof updates.blockMessages === 'boolean') next.blockMessages = updates.blockMessages
        if (!this.hasConversationSettingsModel()) {
            return {
                conversationId,
                userId,
                disappearingMode: next.disappearingMode || 'off',
                blockScreenshots: Boolean(next.blockScreenshots),
                blockMessages: Boolean(next.blockMessages)
            }
        }
        return prisma.conversationUserSetting.upsert({
            where: { conversationId_userId: { conversationId, userId } },
            update: next,
            create: { conversationId, userId, ...next }
        })
    }

    static async assertCanSendToConversation(conversationId, senderId) {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { participants: true }
        })
        if (!conversation) throw new Error("Conversation not found")

        const isParticipant = conversation.participants.some(p => p.userId === senderId)
        if (!isParticipant) throw new Error("User is not a participant of this conversation")

        // For direct chats, recipient can block incoming messages.
        if (conversation.type === 'direct' && this.hasConversationSettingsModel()) {
            const recipient = conversation.participants.find(p => p.userId !== senderId)
            if (recipient?.userId) {
                const recipientSettings = await prisma.conversationUserSetting.findUnique({
                    where: { conversationId_userId: { conversationId, userId: recipient.userId } },
                    select: { blockMessages: true }
                })
                if (recipientSettings?.blockMessages) {
                    throw new Error("This user is not accepting messages in this conversation")
                }
            }
        }

        return conversation
    }

    /**
     * Send a message to a specific conversation
     */
    static async sendMessageToConversation({ 
        conversationId, 
        senderId, 
        content, 
        type = 'text', 
        mediaUrl, 
        thumbnailUrl, 
        duration, 
        size, 
        mimeType,
        replyToId,
        isForwarded = false,
        forwardedFromId
    }) {
        // 1. Validate participation
        const conversation = await this.assertCanSendToConversation(conversationId, senderId)

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
                status: 'sent',
                replyToId,
                isForwarded,
                forwardedFromId
            },
            include: {
                conversation: {
                    select: { participants: true }
                },
                replyTo: true
            }
        })

        // 3. Update Conversation Metadata
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
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
                // DON'T await Kafka in the main flow to avoid blocking on connection issues
                kafkaProducer.send('MESSAGE_SENT', {
                    messageId: message.id,
                    senderId,
                    recipientId,
                    conversationId,
                    content: message.content,
                    type: message.type
                }).catch(err => console.error('❌ Kafka send failed:', err))
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

        const conversations = await prisma.conversation.findMany({
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
        });

        // Find the one with exactly 2 participants
        return conversations.find(conv => conv.participants.length === 2) || null;
    }

    static async getConversations(userId) {
        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    participants: {
                        some: { userId }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                include: {
                    participants: true,
                    messages: {
                        take: 1,
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            })
            
            // Map latest message to `lastMessage` and add small derived fields to make the response easier
            // to understand in Swagger while keeping backward compatibility for the client.
            return conversations.map(conv => {
                const lastMessage = conv.messages?.[0] || null
                const participantUserIds = (conv.participants || []).map(p => p.userId)
                const otherParticipantUserIds = participantUserIds.filter(id => String(id) !== String(userId))
                const otherUserId = conv.type === 'direct' ? (otherParticipantUserIds[0] || null) : null

                const lastMessageAt = lastMessage?.createdAt || conv.updatedAt
                const lastMessagePreview =
                    lastMessage?.content
                        ? lastMessage.content
                        : lastMessage?.mediaUrl
                            ? (lastMessage.type === 'image' ? '📷 Image' : lastMessage.type === 'video' ? '🎬 Video' : lastMessage.type === 'audio' ? '🎧 Audio' : '📎 Attachment')
                            : null

                return {
                    ...conv,
                    lastMessage,
                    lastMessageAt,
                    lastMessagePreview,
                    participantUserIds,
                    otherUserId,
                }
            })
        } catch (error) {
            console.error(`getConversations Error for userId ${userId}:`, error?.message || error)
            throw error
        }
    }

    static async getConversation(conversationId, userId) {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: true,
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        if (!conversation) return null

        // Map the latest message to 'lastMessage' for frontend compatibility
        const result = {
            ...conversation,
            lastMessage: conversation.messages?.[0] || null
        }

        const isParticipant = result.participants.some(p => p.userId === userId)
        if (!isParticipant) throw new Error("Unauthorized to view this conversation")

        return result
    }

    static async getMessages(conversationId) {
        return prisma.message.findMany({
            where: { conversationId },
            include: {
                reactions: true
            },
            orderBy: { createdAt: 'asc' }
        })
    }

    static async deleteMessage(messageId, userId) {
        // Only allow sender to delete their own message (simplified "delete for me" to "delete for all" for now)
        const message = await prisma.message.findUnique({ where: { id: messageId } })
        if (!message) throw new Error("Message not found")
        if (message.senderId !== userId) throw new Error("Unauthorized to delete this message")

        return prisma.message.delete({
            where: { id: messageId }
        })
    }

    static async addReaction(messageId, userId, emoji) {
        return prisma.messageReaction.upsert({
            where: {
                messageId_userId_emoji: {
                    messageId,
                    userId,
                    emoji
                }
            },
            update: {},
            create: {
                messageId,
                userId,
                emoji
            }
        })
    }

    static async removeReaction(messageId, userId, emoji) {
        return prisma.messageReaction.deleteMany({
            where: {
                messageId,
                userId,
                emoji
            }
        })
    }

    static async getMessage(messageId) {
        return prisma.message.findUnique({
            where: { id: messageId },
            include: {
                sender: {
                    select: { id: true, email: true, profile: true }
                },
                reactions: true,
                replyTo: true
            }
        })
    }

    static async updateMessage(messageId, userId, content) {
        const message = await prisma.message.findUnique({ where: { id: messageId } })
        if (!message) throw new Error("Message not found")
        if (message.senderId !== userId) throw new Error("Unauthorized to edit this message")

        return prisma.message.update({
            where: { id: messageId },
            data: {
                content,
                isEdited: true,
                editedAt: new Date()
            }
        })
    }

    static async forwardMessage(messageId, senderId, targetConversationId) {
        const originalMessage = await prisma.message.findUnique({ where: { id: messageId } })
        if (!originalMessage) throw new Error("Original message not found")

        return this.sendMessageToConversation({
            conversationId: targetConversationId,
            senderId,
            content: originalMessage.content,
            type: originalMessage.type,
            mediaUrl: originalMessage.mediaUrl,
            thumbnailUrl: originalMessage.thumbnailUrl,
            duration: originalMessage.duration,
            size: originalMessage.size,
            mimeType: originalMessage.mimeType,
            isForwarded: true,
            forwardedFromId: messageId
        })
    }

    static async hideMessage(messageId, userId) {
        return prisma.hiddenMessage.create({
            data: {
                messageId,
                userId
            }
        })
    }

    static async getMessages(conversationId, userId) {
        if (!userId) {
            return prisma.message.findMany({
                where: { conversationId },
                include: { reactions: true },
                orderBy: { createdAt: 'asc' }
            })
        }
        await this.ensureParticipant(conversationId, userId)
        let settings = null
        if (this.hasConversationSettingsModel()) {
            try {
                settings = await prisma.conversationUserSetting.findUnique({
                    where: { conversationId_userId: { conversationId, userId } },
                    select: { disappearingMode: true }
                })
            } catch (error) {
                this.markConversationSettingsUnavailable(error)
            }
        }
        const mode = settings?.disappearingMode || 'off'
        const now = Date.now()
        let createdAtFilter
        if (mode === '1h') createdAtFilter = new Date(now - 60 * 60 * 1000)
        if (mode === '24h') createdAtFilter = new Date(now - 24 * 60 * 60 * 1000)
        if (mode === '7d') createdAtFilter = new Date(now - 7 * 24 * 60 * 60 * 1000)

        const where = {
            conversationId,
            NOT: {
                hiddenBy: {
                    some: { userId }
                }
            }
        }
        if (createdAtFilter) where.createdAt = { gte: createdAtFilter }

        return prisma.message.findMany({
            where,
            include: {
                reactions: true,
                replyTo: {
                    include: {
                        sender: {
                            select: { id: true, email: true, profile: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    }
}
