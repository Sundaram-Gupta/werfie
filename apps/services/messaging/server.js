import 'dotenv/config'; // Load environment variables first
import express from 'express'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import cors from 'cors'
import { getSocketServer } from './lib/socket.js'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3019

// Prepare Next.js app
const nextApp = next({ dev, hostname, port })
const handle = nextApp.getRequestHandler()

let isAppPrepared = false

console.log('[MessagingService] Starting server in parallel with Next.js preparation...')

const expressApp = express()
const httpServer = createServer()

// 1. CORS Middleware - Global (allow gateway + client for Swagger & app)
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token', 'x-user-id', 'x-verified-gateway', 'x-user-email'],
    credentials: true,
    optionsSuccessStatus: 200
}

expressApp.use(cors(corsOptions))

// 2. Health Check
expressApp.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

// 3. Handle Next.js Requests
expressApp.all('*', (req, res, nextCallback) => {
    if (req.url.includes('/api/messages/ws')) {
        return; // Let Socket.io handle this
    }
    if (!isAppPrepared) {
        if (req.url.startsWith('/api/')) {
            return res.status(503).json({ error: 'Messaging Service warming up' });
        }
        return res.status(503).send('Next.js is still preparing. Please wait...')
    }
    const parsedUrl = parse(req.url, true)
    return handle(req, res, parsedUrl)
})

// 4. Initialize Socket.IO
getSocketServer(httpServer)

// Attach Express to httpServer with path filtering
httpServer.on('request', (req, res) => {
    // Correctly match Socket.IO path (including polling and websocket)
    if (req.url && req.url.includes('/api/messages/ws')) {
        return; // Let Socket.io handle this
    }
    expressApp(req, res);
});

// 5. Start Server (retry on EADDRINUSE so PM2 restarts don't fail)
const MAX_LISTEN_RETRIES = 5
const LISTEN_RETRY_MS = 3000
let listenRetries = 0

function startListening() {
    httpServer.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && listenRetries < MAX_LISTEN_RETRIES) {
            listenRetries++
            console.warn(`[MessagingService] Port ${port} in use, retry ${listenRetries}/${MAX_LISTEN_RETRIES} in ${LISTEN_RETRY_MS / 1000}s...`)
            httpServer.close(() => setTimeout(startListening, LISTEN_RETRY_MS))
            return
        }
        console.error(`[MessagingService] Port ${port} in use or error:`, err.message)
        process.exit(1)
    })

    httpServer.listen(port, '0.0.0.0', (err) => {
        if (err) {
            if (err.code === 'EADDRINUSE' && listenRetries < MAX_LISTEN_RETRIES) {
                listenRetries++
                console.warn(`[MessagingService] Port ${port} in use, retry ${listenRetries}/${MAX_LISTEN_RETRIES} in ${LISTEN_RETRY_MS / 1000}s...`)
                setTimeout(startListening, LISTEN_RETRY_MS)
                return
            }
            console.error('[MessagingService] Failed to listen:', err.message)
            process.exit(1)
            return
        }
        httpServer.removeAllListeners('error')
        console.log(`> Messaging Service listening on http://127.0.0.1:${port}`)

        // Prepare app in background
        console.log('[MessagingService] Preparing Next.js in background...')
        nextApp.prepare().then(() => {
            isAppPrepared = true
            console.log('[MessagingService] Next.js prepared.')
        }).catch(e => {
            console.error('[MessagingService] Next.js preparation FAILED:', e.message)
        })
    })
}

startListening()
