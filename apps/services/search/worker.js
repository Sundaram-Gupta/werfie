import { createIndices } from './lib/elasticsearch.js'
import { startSearchConsumers } from './events/consumers/search.consumer.js'

console.log('👷 Starting Search Worker...')

async function main() {
    try {
        await createIndices()
        await startSearchConsumers()
        console.log('✅ Search Worker is running')
    } catch (error) {
        console.error('❌ Worker failed to start:', error)
        process.exit(1)
    }
}

main()
