import { io } from "socket.io-client"

// Determine URL - default to localhost:3019 for local dev if not going through gateway
const MESSAGING_URL = import.meta.env.VITE_MESSAGING_URL || 'http://localhost:3019'

let socket

export const socketService = {
    connect: () => {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        if (socket && socket.connected) return socket

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

        socket.on("disconnect", () => {
            console.log("🔴 Disconnected from Chat Socket")
        })

        socket.on("connect_error", (err) => {
            console.error("Socket error", err)
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
