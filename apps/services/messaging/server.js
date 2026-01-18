import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { getSocketServer } from './lib/socket.js'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || 3007

app.prepare().then(async () => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true)
        handle(req, res, parsedUrl)
    })

    // Initialize WebSocket Server
    getSocketServer(server)

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`)
        console.log(`> Messaging WS ready at /api/messages/ws`)
    })
})
