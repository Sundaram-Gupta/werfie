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

            // 3. Push Notification (Simulated)
            try {
                // Fetch recipient settings
                const recipient = await prisma.user.findUnique({
                    where: { id: data.userId }
                });

                const lang = recipient?.preferredLanguage || 'en';
                const templates = {
                    en: {
                        like: "New Like",
                        follow: "New Follower",
                        reply: "New Reply"
                    },
                    hi: {
                        like: "नई लाइक",
                        follow: "नया फॉलोअर",
                        reply: "नया जवाब"
                    },
                    es: {
                        like: "Nuevo Me gusta",
                        follow: "Nuevo Seguidor",
                        reply: "Nueva Respuesta"
                    },
                    fr: {
                        like: "Nouveau J'aime",
                        follow: "Nouvel Abonné",
                        reply: "Nouvelle Réponse"
                    },
                    de: {
                        like: "Neues 'Gefällt mir'",
                        follow: "Neuer Follower",
                        reply: "Neue Antwort"
                    }
                };

                const title = templates[lang]?.[data.type] || templates['en'][data.type] || "New Notification";
                console.log(`[PUSH] Sending to ${data.userId} in ${lang}: ${title}`);

            } catch (pushError) {
                console.error("Push Notification Error:", pushError);
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
