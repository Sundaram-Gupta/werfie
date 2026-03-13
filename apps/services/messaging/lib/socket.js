import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from './auth.js'

const prisma = new PrismaClient()
let io

export function getSocketServer(httpServer) {
    if (!io && httpServer) {
        io = new Server(httpServer, {
            path: '/api/messages/ws',
            cors: {
                origin: "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true
            },
            adapter: undefined // Ready for redis-adapter in future
        })

        // Middleware for Authentication (async - verifyJWT returns a Promise)
        io.use(async (socket, next) => {
            console.log('--- New Socket Auth Attempt ---')
            let token = socket.handshake.auth?.token || socket.handshake.query?.token
            if (typeof token === 'string') token = token.trim().replace(/\s+/g, ' ')

            if (!token) {
                console.error('❌ Socket Auth Failed: No token provided')
                return next(new Error('Authentication error: Token required'))
            }

            try {
                const decoded = await verifyJWT(token)
                const userId = decoded.userId || decoded.sub
                console.log('✅ Socket Auth Success. User:', userId)
                socket.user = { ...decoded, userId }
                next()
            } catch (err) {
                console.error('❌ Socket Auth Failed: Verification Error:', err.message)
                next(new Error('Authentication error: Invalid token'))
            }
        })

        io.on('connection', (socket) => {
            const userId = socket.user.userId
            console.log(`🔌 User connected: ${userId}`)

            // Join personal room for notifications/direct events
            socket.join(`user:${userId}`)

            // Update user status (simulated online presence)
            // In a real app with scaling, use Redis for presence
            socket.broadcast.emit('user_online', { userId })

            // Join Conversation
            socket.on('join_conversation', (conversationId, callback) => {
                socket.join(`conversation:${conversationId}`)
                console.log(`👤 User ${userId} joined room ${conversationId}`)
                if (typeof callback === 'function') callback({ status: 'ok' })
            })

            // Leave Conversation
            socket.on('leave_conversation', (conversationId) => {
                socket.leave(`conversation:${conversationId}`)
            })

            // Typing Indicators
            socket.on('typing_start', ({ conversationId }) => {
                socket.to(`conversation:${conversationId}`).emit('typing_start', {
                    conversationId,
                    userId
                })
            })

            socket.on('typing_stop', ({ conversationId }) => {
                socket.to(`conversation:${conversationId}`).emit('typing_stop', {
                    conversationId,
                    userId
                })
            })

            // Send Message
            socket.on('send_message', async (data, callback) => {
                try {
                    const { conversationId, content, type = 'text', mediaUrl, thumbnailUrl, duration, size, mimeType } = data

                    // Import dynamically to avoid circular dependency issues if any
                    const { MessagingService } = await import('../services/messaging.service.js')

                    if (conversationId) {
                        const message = await MessagingService.sendMessageToConversation({
                            conversationId,
                            senderId: userId,
                            content,
                            type,
                            mediaUrl,
                            thumbnailUrl,
                            duration,
                            size,
                            mimeType
                        })
                        if (typeof callback === 'function') callback({ status: 'ok', message })
                    } else if (data.recipientId) {
                        // Fallback for direct message creation via socket if needed
                        const message = await MessagingService.sendMessage({
                            senderId: userId,
                            recipientId: data.recipientId,
                            content,
                            type,
                            mediaUrl,
                            thumbnailUrl,
                            duration,
                            size,
                            mimeType
                        })
                        if (typeof callback === 'function') callback({ status: 'ok', message })
                    } else {
                        throw new Error("Conversation ID or Recipient ID required")
                    }

                } catch (error) {
                    console.error('Send message error:', error)
                    socket.emit('error', { message: error.message || 'Failed to send message' })
                    if (typeof callback === 'function') callback({ status: 'error', error: error.message })
                }
            })

            // Mark Read
            socket.on('mark_read', async ({ conversationId, messageIds }) => {
                try {
                    // Update Paticipant last read
                    await prisma.participant.update({
                        where: {
                            userId_conversationId: {
                                userId,
                                conversationId
                            }
                        },
                        data: {
                            lastReadAt: new Date()
                        }
                    })
                } catch (e) {
                    console.error('Mark read error', e)
                }
            })

            socket.on('disconnect', (reason) => {
                console.log(`❌ User disconnected: ${userId}. Reason: ${reason}`)
                socket.broadcast.emit('user_offline', { userId })
            })
        })
    }
    return io
}

export function getIO() {
    return io
}
