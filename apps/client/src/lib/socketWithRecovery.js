import { io } from 'socket.io-client'

/**
 * Create a Socket.IO client with automatic recovery from "Session ID unknown" (400).
 * When the server returns 400 because the sid is invalid (e.g. after content-service restart),
 * the client forces a disconnect and fresh handshake instead of retrying with the stale sid.
 */
export function createSocketWithRecovery(url, options = {}) {
    const socket = io(url, {
        path: options.path ?? '/ws/live',
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 800,
        reconnectionDelayMax: 4000,
        ...options,
    })

    let recovering = false
    const isSessionUnknown = (err) => {
        const msg = (err?.message || String(err || '')).toLowerCase()
        return msg.includes('session') || msg.includes('unknown') || msg.includes('sid')
    }

    const forceReconnect = () => {
        if (recovering) return
        recovering = true
        socket.disconnect()
        socket.connect()
        setTimeout(() => { recovering = false }, 2000)
    }

    socket.on('connect_error', (err) => {
        if (isSessionUnknown(err)) {
            forceReconnect()
        }
    })

    socket.on('disconnect', (reason) => {
        if (reason === 'transport error' || reason === 'transport close') {
            forceReconnect()
        }
    })

    return socket
}
