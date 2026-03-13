import { startPostCreatedConsumer } from './events/consumers/post-created.consumer.js'

console.log('👷 Starting Timeline Worker...')

async function main() {
    try {
        // Start Consumers
        await startPostCreatedConsumer()
        console.log('✅ Timeline Worker is running')
    } catch (error) {
        console.error('❌ Worker failed to start:', error)
        process.exit(1)
    }
}

main()
