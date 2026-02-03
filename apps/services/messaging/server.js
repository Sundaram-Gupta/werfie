import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { getSocketServer } from './lib/socket.js'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const port = process.env.PORT || 3019

app.prepare().then(() => {
    console.log('🚀 Messaging Service Starting...')
    console.log('🔐 JWT Strategy: Using local env or dev-secret')

    // Check if secret is loaded
    const secret = process.env.JWT_SECRET || 'dev-secret'
    console.log(`🔐 Active Secret: ${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}`)

    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true)

        // Manual CORS to ensure preflights pass for Client (port 5173)
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, x-user-id');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
        }

        handle(req, res, parsedUrl)
    })

    // Initialize WebSocket Server
    getSocketServer(server)

    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`)
        console.log(`> Messaging WS ready at /api/messages/ws`)
    })
}).catch(err => {
    console.error('Error starting server:', err)
})
