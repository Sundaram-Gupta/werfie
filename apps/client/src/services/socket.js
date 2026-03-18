import { io } from "socket.io-client"
import axios from "axios"
import { getApiBase, getGatewayUrl } from "@/lib/api"

// Use '' for same-origin when unset (Vite proxy handles /api; works via IP e.g. 192.168.1.37:5173)
const API_URL = import.meta.env.VITE_API_URL || ''
// Prefer direct gateway connection for socket to avoid Vite proxy websocket flakiness on refresh/LAN
const MESSAGING_URL = import.meta.env.VITE_MESSAGING_URL || getGatewayUrl() || API_URL

let socket

async function tryRefreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return null
    const base = getApiBase()
    const { data } = await axios.post(`${base}/api/auth/refresh`, { refreshToken })
    const payload = data?.data ?? data
    const accessToken = payload?.accessToken
    if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
        return accessToken
    }
    return null
}

export const socketService = {
    connect: () => {
        const raw = localStorage.getItem('accessToken')
        const token = raw ? raw.trim().replace(/\s+/g, ' ') : null
        if (!token) return null

        if (socket) return socket // Return existing socket (even if connecting) to avoid duplicates
        let refreshing = false

        socket = io(MESSAGING_URL, {
            path: '/api/messages/ws',
            auth: {
                token
            },
            query: {
                token
            },
            transports: ['websocket', 'polling']
        })

        socket.on("connect", () => {
            console.log("🟢 Connected to Chat Socket", socket.id)
        })

        socket.on("disconnect", (reason) => {
            console.log("🔴 Disconnected from Chat Socket. Reason:", reason)
        })

        socket.on("connect_error", (err) => {
            console.error("Socket error", err)
            const msg = err?.message || ''
            const looksLikeAuth =
                msg.toLowerCase().includes('authentication') ||
                msg.toLowerCase().includes('invalid token') ||
                msg.toLowerCase().includes('jwt expired')

            // If access token expired, refresh and reconnect once
            if (looksLikeAuth && !refreshing) {
                refreshing = true
                ;(async () => {
                    try {
                        const newAccessToken = await tryRefreshAccessToken()
                        if (!newAccessToken) {
                            socket?.disconnect()
                            socket = null
                            return
                        }

                        socket?.disconnect()
                        socket = null
                        socketService.connect()
                    } catch (e) {
                        socket?.disconnect()
                        socket = null
                    } finally {
                        refreshing = false
                    }
                })()
            }
        })

        return socket
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect()
            socket = null
        }
    },

    getSocket: () => socket,

    // Event Emitters
    joinConversation: (conversationId) => {
        if (socket) socket.emit('join_conversation', conversationId)
    },

    leaveConversation: (conversationId) => {
        if (socket) socket.emit('leave_conversation', conversationId)
    },

    sendMessage: (data) => {
        // data: { conversationId, content, type, mediaUrl }
        if (socket) socket.emit('send_message', data)
    },

    startTyping: (conversationId) => {
        if (socket) socket.emit('typing_start', { conversationId })
    },

    stopTyping: (conversationId) => {
        if (socket) socket.emit('typing_stop', { conversationId })
    },

    markRead: (conversationId, messageIds) => {
        if (socket) socket.emit('mark_read', { conversationId, messageIds })
    }
}
