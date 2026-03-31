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
    static _hiddenMessageTableAvailable = true
    static _messageReactionTableAvailable = true

    static hasConversationSettingsModel() {
        return Boolean(prisma?.conversationUserSetting) && this._conversationSettingsTableAvailable
    }

    static hasHiddenMessageModel() {
        return Boolean(prisma?.hiddenMessage) && this._hiddenMessageTableAvailable
    }

    static hasMessageReactionModel() {
        return Boolean(prisma?.messageReaction) && this._messageReactionTableAvailable
    }

    static markMessagingTableUnavailable(error) {
        const msg = String(error?.message || '')
        const isMissingTable = error?.code === 'P2021' || /does not exist/i.test(msg) || /relation.*does not exist/i.test(msg)
        const isMissingColumn = error?.code === 'P2022' || /column.*does not exist/i.test(msg)
        if (!(isMissingTable || isMissingColumn)) return

        if (/ConversationUserSetting/i.test(msg)) {
            this._conversationSettingsTableAvailable = false
            console.warn('[MessagingService] ConversationUserSetting unavailable; using fallback behavior.')
        }
        if (/HiddenMessage/i.test(msg)) {
            this._hiddenMessageTableAvailable = false
            console.warn('[MessagingService] HiddenMessage unavailable; disabling hidden-message filters.')
        }
        if (/MessageReaction/i.test(msg)) {
            this._messageReactionTableAvailable = false
            console.warn('[MessagingService] MessageReaction unavailable; disabling reactions includes.')
        }
    }

    static markConversationSettingsUnavailable(error) {
        // P2021 = table does not exist. Disable settings queries for this process.
        const msg = String(error?.message || '')
        const isTableMissing = error?.code === 'P2021' || /does not exist/i.test(msg) || /relation.*does not exist/i.test(msg)
        if (isTableMissing) {
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
        try {
            return await prisma.conversationUserSetting.upsert({
                where: { conversationId_userId: { conversationId, userId } },
                update: next,
                create: { conversationId, userId, ...next }
            })
        } catch (error) {
            this.markConversationSettingsUnavailable(error)
            return {
                conversationId,
                userId,
                disappearingMode: next.disappearingMode || 'off',
                blockScreenshots: Boolean(next.blockScreenshots),
                blockMessages: Boolean(next.blockMessages)
            }
        }
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
                try {
                    const recipientSettings = await prisma.conversationUserSetting.findUnique({
                        where: { conversationId_userId: { conversationId, userId: recipient.userId } },
                        select: { blockMessages: true }
                    })

                    if (recipientSettings?.blockMessages) {
                        throw new Error("This user is not accepting messages in this conversation")
                    }

                    // Check global user-to-user block (new spec)
                    const globalSetting = await prisma.chatSetting.findUnique({
                        where: { 
                            userId_targetUserId: { 
                                userId: recipient.userId, 
                                targetUserId: senderId 
                            } 
                        },
                        select: { isBlocked: true }
                    })
                    if (globalSetting?.isBlocked) {
                        throw new Error("You are blocked by this user.")
                    }
                } catch (error) {
                    // If the table doesn't exist in DB yet, disable settings and proceed.
                    this.markConversationSettingsUnavailable(error)
                    // Preserve original behavior for real "not accepting messages" blocks.
                    if (/not accepting messages/i.test(String(error?.message || ''))) throw error
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
        const participantsData = user1 === user2 
            ? [{ userId: user1 }] 
            : [{ userId: user1 }, { userId: user2 }]

        return prisma.conversation.create({
            data: {
                type: 'direct',
                participants: {
                    create: participantsData
                }
            },
            include: {
                participants: true,
                messages: { take: 1 }
            }
        })
    }

    static async findDirectConversation(user1, user2) {
        if (user1 === user2) {
            // Self-chat: find conversation where this user is the ONLY participant
            const conversations = await prisma.conversation.findMany({
                where: {
                    type: 'direct',
                    participants: {
                        every: { userId: user1 }
                    }
                },
                include: {
                    participants: true
                }
            });
            return conversations.find(conv => conv.participants.length === 1) || null;
        }

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
            let conversations
            try {
                conversations = await prisma.conversation.findMany({
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
            } catch (error) {
                this.markMessagingTableUnavailable(error)
                conversations = await prisma.conversation.findMany({
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
                            orderBy: { createdAt: 'desc' },
                            select: { id: true, content: true, type: true, mediaUrl: true, createdAt: true }
                        }
                    }
                })
            }
            
            // Map latest message to `lastMessage` and add small derived fields to make the response easier
            // to understand in Swagger while keeping backward compatibility for the client.
            return conversations.map(conv => {
                const me = conv.participants.find(p => p.userId === userId)
                const clearedAt = me?.clearedAt || null
                
                let lastMessage = conv.messages?.[0] || null
                // If the last message is older than clearedAt, don't show it
                if (lastMessage && clearedAt && new Date(lastMessage.createdAt) < new Date(clearedAt)) {
                    lastMessage = null
                }

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

    static async clearConversation(conversationId, userId) {
        await this.ensureParticipant(conversationId, userId)
        return prisma.participant.update({
            where: { userId_conversationId: { userId, conversationId } },
            data: { clearedAt: new Date() }
        })
    }

    static async deleteConversation(conversationId, userId) {
        await this.ensureParticipant(conversationId, userId)
        // We delete the participant record so it no longer appears in the user's list
        return prisma.participant.delete({
            where: { userId_conversationId: { userId, conversationId } }
        })
    }

    static async getMessages(conversationId, userId) {
        if (!userId) {
            return prisma.message.findMany({
                where: { conversationId },
                include: this.hasMessageReactionModel() ? { reactions: true } : undefined,
                orderBy: { createdAt: 'asc' }
            })
        }
        const participant = await prisma.participant.findUnique({
             where: { userId_conversationId: { userId, conversationId } },
             select: { clearedAt: true }
        })
        if (!participant) throw new Error("Unauthorized to access this conversation")

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
        let disappearingFilter
        if (mode === '1h') disappearingFilter = new Date(now - 60 * 60 * 1000)
        if (mode === '24h') disappearingFilter = new Date(now - 24 * 60 * 60 * 1000)
        if (mode === '7d') disappearingFilter = new Date(now - 7 * 24 * 60 * 60 * 1000)

        const where = { conversationId }
        if (this.hasHiddenMessageModel()) {
            where.NOT = {
                hiddenBy: {
                    some: { userId }
                }
            }
        }

        // Combine filters: Must be after clearedAt AND after disappearingFilter
        const filters = []
        if (participant.clearedAt) filters.push({ gte: participant.clearedAt })
        if (disappearingFilter) filters.push({ gte: disappearingFilter })

        if (filters.length > 0) {
            // Prisma gte filters can be combined using math logic or overlapping
            // For chronological history, we want messages where createdAt is >= MAX(clearedAt, disappearingFilter)
            let finalGte = null
            filters.forEach(f => {
                if (!finalGte || f.gte > finalGte) finalGte = f.gte
            })
            where.createdAt = { gte: finalGte }
        }

        try {
            return await prisma.message.findMany({
                where,
                include: {
                    ...(this.hasMessageReactionModel() ? { reactions: true } : {}),
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
        } catch (error) {
            this.markMessagingTableUnavailable(error)
            return prisma.message.findMany({
                where: { conversationId },
                orderBy: { createdAt: 'asc' }
            })
        }
    }

    static async searchMessages(conversationId, userId, query) {
        await this.ensureParticipant(conversationId, userId)
        if (!query) return []

        const participant = await prisma.participant.findUnique({
            where: { userId_conversationId: { userId, conversationId } },
            select: { clearedAt: true }
        })

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
        let disappearingFilter
        if (mode === '1h') disappearingFilter = new Date(now - 60 * 60 * 1000)
        if (mode === '24h') disappearingFilter = new Date(now - 24 * 60 * 60 * 1000)
        if (mode === '7d') disappearingFilter = new Date(now - 7 * 24 * 60 * 60 * 1000)

        const where = {
            conversationId,
            content: { contains: query, mode: 'insensitive' }
        }

        const filters = []
        if (participant?.clearedAt) filters.push({ gte: participant.clearedAt })
        if (disappearingFilter) filters.push({ gte: disappearingFilter })

        if (filters.length > 0) {
            let finalGte = null
            filters.forEach(f => {
                if (!finalGte || f.gte > finalGte) finalGte = f.gte
            })
            where.createdAt = { gte: finalGte }
        }

        return prisma.message.findMany({
            where,
            include: {
                sender: {
                    select: { id: true, email: true, profile: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })
    }
}
