import 'dotenv/config'; // Load environment variables first
import express from 'express'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
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
const prisma = new PrismaClient()

async function ensureMessagingSchemaCompatibility() {
    // Self-heal for older DBs missing newer messaging columns.
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "Message"
        ADD COLUMN IF NOT EXISTS "replyToId" TEXT,
        ADD COLUMN IF NOT EXISTS "isForwarded" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "forwardedFromId" TEXT,
        ADD COLUMN IF NOT EXISTS "isEdited" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3)
    `)

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "HiddenMessage" (
            "id" TEXT NOT NULL,
            "messageId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "HiddenMessage_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "HiddenMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "HiddenMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "HiddenMessage_messageId_userId_key" ON "HiddenMessage"("messageId", "userId")`)

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MessageReaction" (
            "id" TEXT NOT NULL,
            "messageId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "emoji" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId", "userId", "emoji")`)

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ConversationUserSetting" (
            "id" TEXT NOT NULL,
            "conversationId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "disappearingMode" TEXT NOT NULL DEFAULT 'off',
            "blockScreenshots" BOOLEAN NOT NULL DEFAULT false,
            "blockMessages" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ConversationUserSetting_pkey" PRIMARY KEY ("id"),
            CONSTRAINT "ConversationUserSetting_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "ConversationUserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
    `)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ConversationUserSetting_conversationId_userId_key" ON "ConversationUserSetting"("conversationId", "userId")`)
}

// 1. CORS Middleware - Global (allow gateway + client for Swagger & app)
const corsOptions = {
    origin: (origin, callback) => callback(null, true), // Allow all origins in dev
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

import multer from 'multer';
import { uploadToR2 } from './lib/r2.js';
import { processImage, processVideo, processAudio } from './lib/media-processor.js';
import { getUserFromRequest } from './lib/auth.js';

// Setup Multer (memoryStorage) for File Uploads as requested for Flutter
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // Allows up to 100MB for video, 10MB checked in handlers
});

// 3. File Upload Pipeline (Express Route) before Next.js
expressApp.post('/api/messages/upload', upload.any(), async (req, res) => {
    try {
        console.log("📝 [Express Upload] Request received from Flutter/Client");

        // Auth check headers/JWT
        const user = await getUserFromRequest(req);
        if (!user.userId) {
             console.error("❌ [Express Upload] Unauthorized: No userId");
             return res.status(401).json({ status: false, message: 'Unauthorized', data: null });
        }

        // Multer puts files in req.files
        if (!req.files || req.files.length === 0) {
            console.error("❌ [Express Upload] No file in req.files! Keys in body:", Object.keys(req.body));
            return res.status(400).json({ status: false, message: 'No file uploaded', data: null });
        }

        const file = req.files[0];
        const buffer = file.buffer;
        const type = file.mimetype || '';
        const size = file.size;

        console.log(`📂 [Express Upload] File received. Field: ${file.fieldname}, Type: ${type}, Size: ${size} bytes`);

        if (type.startsWith('image/')) {
            if (size > 10 * 1024 * 1024) throw new Error('Image too large (max 10MB)');
            
            console.log("🖼️ [Express Upload] Processing Image from Buffer...");
            // processImage returns { buffer, filename, mimeType, size } - NO DISK STORAGE
            const result = await processImage(buffer);
            console.log("🚀 [Express Upload] Uploading optimized buffer to R2...");
            
            const url = await uploadToR2(result.buffer, result.mimeType, 'chat/images');
            console.log(`✅ [Express Upload] Success: ${url}`);
            
            return res.status(200).json({ 
                 status: true, 
                 message: 'Media uploaded successfully', 
                 data: { url, mimeType: result.mimeType, size: result.size } 
            });
        }
        
        // Handle other types (Video/Audio) using existing functions (which may use temp disk storage but that's handled by them)
        if (type.startsWith('video/')) {
             if (size > 100 * 1024 * 1024) throw new Error('Video too large (max 100MB)');
             console.log("🎥 [Express Upload] Processing Video...");
             
             // processVideo needs a file path. We write temp file manually.
             const fs = await import('fs');
             const path = await import('path');
             const os = await import('os');
             const { v4: uuidv4 } = await import('uuid');
             
             const tempPath = path.join(os.tmpdir(), `${uuidv4()}_input.mp4`);
             fs.writeFileSync(tempPath, buffer);
             
             try {
                 const result = await processVideo(tempPath);
                 if (result.cleanup) result.cleanup();
                 if (!fs.existsSync(result.video.path)) throw new Error('Processed video file not found');
                 
                 const videoContent = fs.readFileSync(result.video.path);
                 const videoUrl = await uploadToR2(videoContent, result.video.mimeType, 'chat/videos');
                 
                 let thumbnailUrl = null;
                 if (result.thumbnail && fs.existsSync(result.thumbnail.path)) {
                     const thumbContent = fs.readFileSync(result.thumbnail.path);
                     thumbnailUrl = await uploadToR2(thumbContent, result.thumbnail.mimeType, 'chat/thumbnails');
                 }
                 
                 return res.status(200).json({
                     status: true, message: 'Media uploaded successfully',
                     data: { url: videoUrl, thumbnailUrl: thumbnailUrl, duration: result.duration, mimeType: result.video.mimeType }
                 });
             } finally {
                 try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch(e){}
             }
        }
        
        throw new Error(`Unsupported file type: ${type}`);
        
    } catch (error) {
        console.error("❌ [Express Upload] Failed:", error);
        return res.status(500).json({ status: false, message: `Processing error: ${error.message}`, data: null });
    }
});

// 4. Handle Next.js Requests
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

ensureMessagingSchemaCompatibility()
    .then(() => {
        startListening()
    })
    .catch((err) => {
        console.error('[MessagingService] Failed to ensure schema compatibility on startup:', err)
        process.exit(1)
    })
