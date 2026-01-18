import { KafkaConsumer } from '../../lib/kafka.js'
import { TimelineService } from '../../services/timeline.service.js'

export async function startPostCreatedConsumer() {
    const consumer = new KafkaConsumer('timeline-service-group', ['POST_CREATED'])

    consumer.on('POST_CREATED', async (data) => {
        console.log('📨 Processing POST_CREATED event:', data)
        const { id, userId } = data

        // We expect 'id' (postId) and 'userId' (author) in event data
        if (id && userId) {
            await TimelineService.fanOutPost(id, userId)
        } else {
            console.warn('⚠️ Invalid event data for POST_CREATED', data)
        }
    })

    await consumer.start()
}
