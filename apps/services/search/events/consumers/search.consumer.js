import { KafkaConsumer } from '../../lib/kafka.js'
import { SearchService } from '../../services/search.service.js'

export async function startSearchConsumers() {
    const consumer = new KafkaConsumer('search-service-group', ['POST_CREATED'])

    consumer.on('POST_CREATED', async (data) => {
        // data: { id, userId, content, createdAt }
        await SearchService.indexPost(data)
    })

    await consumer.start()
}
