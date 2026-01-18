import { KafkaConsumer } from '../../lib/kafka.js'
import { NotificationService } from '../../services/notification.service.js'

export async function startNotificationConsumers() {
    const consumer = new KafkaConsumer('notification-service-group', ['POST_LIKED', 'FOLLOW_CREATED'])

    consumer.on('POST_LIKED', async (data) => {
        // data: { postId, userId (owner), actorId (liker) }
        if (data.userId !== data.actorId) {
            await NotificationService.createNotification({
                userId: data.userId,
                type: 'like',
                actorId: data.actorId,
                postId: data.postId
            })
        }
    })

    consumer.on('FOLLOW_CREATED', async (data) => {
        // data: { followerId, followingId }
        await NotificationService.createNotification({
            userId: data.followingId,
            type: 'follow',
            actorId: data.followerId
        })
    })

    await consumer.start()
}
