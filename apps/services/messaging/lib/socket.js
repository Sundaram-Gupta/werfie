import { Server } from 'socket.io'

let io

export function getSocketServer(httpServer) {
    if (!io && httpServer) {
        io = new Server(httpServer, {
            path: '/api/notifications/ws',
            cors: { origin: '*' }
        })

        io.on('connection', (socket) => {
            console.log('🔌 Client connected to Notification WS')

            const userId = socket.handshake.query.userId
            if (userId) {
                socket.join(`user:${userId}`)
                console.log(`👤 User ${userId} subscribed to notifications`)
            }

            socket.on('disconnect', () => {
                console.log('🔌 Client disconnected')
            })
        })
    }
    return io
}

export function getIO() {
    return io
}
