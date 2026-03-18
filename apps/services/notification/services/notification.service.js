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
                        reply: "New Reply",
                        repost: "New Repost",
                        message: "New Message"
                    },
                    hi: {
                        like: "नई लाइक",
                        follow: "नया फॉलोअर",
                        reply: "नया जवाब",
                        repost: "नई रीपोस्ट",
                        message: "नया संदेश"
                    },
                    es: {
                        like: "Nuevo Me gusta",
                        follow: "Nuevo Seguidor",
                        reply: "Nueva Respuesta",
                        repost: "Nuevo Repost",
                        message: "Nuevo Mensaje"
                    },
                    fr: {
                        like: "Nouveau J'aime",
                        follow: "Nouvel Abonné",
                        reply: "Nouvelle Réponse",
                        repost: "Nouveau Repost",
                        message: "Nouveau Message"
                    },
                    de: {
                        like: "Neues 'Gefällt mir'",
                        follow: "Neuer Follower",
                        reply: "Neue Antwort",
                        repost: "Neuer Repost",
                        message: "Neue Nachricht"
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
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        // Manual enrichment as fallback for relationship issues
        const enriched = await Promise.all(notifications.map(async (n) => {
            try {
                if (!n.actorId) return n;
                const actor = await prisma.user.findUnique({
                    where: { id: n.actorId }
                });
                if (actor) {
                    const profile = await prisma.profile.findUnique({
                        where: { userId: n.actorId }
                    });
                    actor.profile = profile;
                }
                return { ...n, actor };
            } catch (err) {
                console.error(`Failed to enrich notification ${n.id}:`, err);
                return n;
            }
        }));

        return enriched;
    }

    static async markAsRead(id) {
        return prisma.notification.update({
            where: { id },
            data: { read: true }
        })
    }
}
