import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
// CORS is handled by the Nginx Gateway, not by individual services
app.use(express.json())

// Ensure upload dir exists
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${uuidv4()}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

// Serve static files
app.use('/files', express.static(uploadDir))

// Upload Endpoint
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = `/api/media/files/${req.file.filename}`

    // In real app: Upload to S3 here

    res.json({
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
    })
})

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'media-service' }))
app.get('/media/health', (req, res) => res.json({ status: 'healthy', service: 'media-service' }))

const PORT = process.env.PORT || 3008
app.listen(PORT, () => {
    console.log(`Media Service running on port ${PORT}`)
})
