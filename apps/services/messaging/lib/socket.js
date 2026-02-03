import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { verifyJWT } from './auth.js'

const prisma = new PrismaClient()
let io

export function getSocketServer(httpServer) {
    if (!io && httpServer) {
        io = new Server(httpServer, {
            path: '/api/messages/ws',
            cors: { origin: '*' },
            adapter: undefined // Ready for redis-adapter in future
        })

        // Middleware for Authentication
        io.use((socket, next) => {
            console.log('--- New Socket Auth Attempt ---')
            const token = socket.handshake.auth?.token || socket.handshake.query?.token

            if (!token) {
                console.error('❌ Socket Auth Failed: No token provided')
                return next(new Error('Authentication error: Token required'))
            }

            console.log('🔑 Token received:', token.substring(0, 15) + '...')

            try {
                const decoded = verifyJWT(token)
                console.log('✅ Socket Auth Success. User:', decoded.userId || decoded.sub)
                socket.user = decoded
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
            socket.on('join_conversation', (conversationId) => {
                socket.join(`conversation:${conversationId}`)
                console.log(`👤 User ${userId} joined room ${conversationId}`)
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
            socket.on('send_message', async (data) => {
                // data: { conversationId, content, type, mediaUrl }
                try {
                    const { conversationId, content, type = 'text', mediaUrl } = data

                    // 1. Save to DB
                    const message = await prisma.message.create({
                        data: {
                            conversationId,
                            senderId: userId,
                            content,
                            type,
                            mediaUrl,
                            status: 'sent'
                        },
                        include: {
                            conversation: {
                                select: { participants: true }
                            }
                        }
                    })

                    // 2. Update Conversation Last Message
                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: {
                            lastMessageAt: new Date(),
                            lastMessageId: message.id
                        }
                    })

                    // 3. Emit to room (Real-time delivery)
                    io.to(`conversation:${conversationId}`).emit('receive_message', message)

                    // 4. Send notification to offline participants (or pushing to user rooms)
                    // This can be handled by event bus or direct check here
                    message.conversation.participants.forEach(p => {
                        if (p.userId !== userId) {
                            io.to(`user:${p.userId}`).emit('new_message_notification', message)
                        }
                    })

                } catch (error) {
                    console.error('Send message error:', error)
                    socket.emit('error', { message: 'Failed to send message' })
                }
            })

            // Mark Read
            socket.on('mark_read', async ({ conversationId, messageIds }) => {
                // Update in DB
                // This is complex as we need to track who read what. 
                // Simplified: Update Participant.lastReadAt
                try {
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

                    // Emit read status
                    // io.to(`conversation:${conversationId}`).emit('message_read', { conversationId, userId, timestamp: new Date() })

                } catch (e) {
                    console.error(e)
                }
            })

            socket.on('disconnect', () => {
                console.log(`❌ User disconnected: ${userId}`)
                socket.broadcast.emit('user_offline', { userId })
            })
        })
    }
    return io
}

export function getIO() {
    return io
}
