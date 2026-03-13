import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { getSocketServer } from './lib/socket.js'
import { startNotificationConsumers } from './events/consumers/notification.consumer.js'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || 3005

app.prepare().then(async () => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
    })

    // Initialize WebSocket Server
    getSocketServer(server)

    // Start Kafka Consumers
    try {
        await startNotificationConsumers()
        console.log('✅ Notification Consumers started')
    } catch (err) {
        console.error('❌ Failed to start consumers:', err)
    }

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`)
        console.log(`> WebSocket server ready at /api/notifications/ws`)
    })
})
