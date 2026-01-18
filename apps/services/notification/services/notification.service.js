import { PrismaClient } from '@prisma/client'
import { getIO } from '../lib/socket.js'

const prisma = new PrismaClient()

export class NotificationService {
    static async createNotification(data) {
        try {
            // 1. Save to DB
            const notification = await prisma.notification.create({
                data
            })

            // 2. Send Real-time Update via WebSocket
            const io = getIO()
            if (io) {
                io.to(`user:${data.userId}`).emit('notification', notification)
                console.log(`📡 Sent real-time notification to ${data.userId}`)
            }

            return notification
        } catch (error) {
            console.error('❌ Error creating notification:', error)
            throw error
        }
    }

    static async getNotifications(userId, limit = 20) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        })
    }

    static async markAsRead(id) {
        return prisma.notification.update({
            where: { id },
            data: { read: true }
        })
    }
}
