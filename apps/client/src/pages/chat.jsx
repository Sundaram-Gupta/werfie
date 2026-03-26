import { Avatar, AvatarFallback, AvatarImage, getAvatarColor } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Mail, Search, Settings, MessageSquarePlus, Smile, Send, MoreVertical, X, Users2, Plus, Check, ArrowLeft, ArrowRight, Link2, Phone, Video, User, Clock, CameraOff, Ban, MessageCircle, Forward, Copy, Info, Trash2, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { useState, useRef, useEffect } from "react"
import { cn, getMediaUrl } from "@/lib/utils"
import EmojiPicker from 'emoji-picker-react'
import { mediaService, searchService, messagingService, userService } from "@/services/api"
import { socketService } from "@/services/socket"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { useSocket } from "@/context/SocketContext"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const normalizeUser = (user) => {
    if (!user) return null;
    const emailPrefix = user.email ? user.email.split('@')[0] : 'user';
    return {
        id: user.id || user._id,
        name: user.name || user.profile?.name || emailPrefix || 'Unknown',
        handle: user.handle || user.username || user.profile?.handle || emailPrefix || 'unknown',
        avatar: user.avatar || user.profile?.avatar,
        verified: user.verified || user.profile?.verified,
        createdAt: user.createdAt || user.profile?.createdAt
    };
};

function formatRelativeTime(dateOrStr) {
    if (!dateOrStr) return ''
    const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr)
    const now = new Date()
    const diffMs = now - d
    if (diffMs < 60000) return 'now'
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m`
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h`
    if (diffMs < 604800000) return `${Math.floor(diffMs / 86400000)}d`
    return formatDistanceToNow(d, { addSuffix: false })
}

function formatJoinedDate(dateOrStr) {
    if (!dateOrStr) return 'Joined recently'
    const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr)
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `Joined ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatDayLabel(dateOrStr) {
    if (!dateOrStr) return ''
    const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr)
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfThatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const diffDays = Math.round((startOfToday - startOfThatDay) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: '2-digit' }).format(d)
}


export default function Chat() {
    const { t } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const { user: authUser, loading: authLoading } = useAuth()
    const { socket } = useSocket()
    const currentUser = normalizeUser(authUser)
    const [conversations, setConversations] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [loading, setLoading] = useState(true)

    // New State for Media/Emoji
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [mediaAttachment, setMediaAttachment] = useState(null) // { url, type }
    const fileInputRef = useRef(null)
    const messagesEndRef = useRef(null)
    const [searchResults, setSearchResults] = useState([])
    const [typingUsers, setTypingUsers] = useState({}) // { conversationId: [userIds] }
    const [showNewMessageModal, setShowNewMessageModal] = useState(false)
    const [modalSearchQuery, setModalSearchQuery] = useState("")
    const [modalSearchResults, setModalSearchResults] = useState([])
    const [followingUsers, setFollowingUsers] = useState([])
    const [showUserInfoModal, setShowUserInfoModal] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)
    const [showForwardModal, setShowForwardModal] = useState(false)
    const [forwardingMessage, setForwardingMessage] = useState(null)
    const [showMessageInfoModal, setShowMessageInfoModal] = useState(false)
    const [selectedMessageDetail, setSelectedMessageDetail] = useState(null)
    const [conversationsReady, setConversationsReady] = useState(false)

    // Handlers for message actions
    const handleReply = (msg) => {
        setReplyingTo(msg)
        fileInputRef.current?.focus() // Focus the input
    }

    const handleForward = (msg) => {
        setForwardingMessage(msg)
        setShowForwardModal(true)
    }

    const handleInfo = (msg) => {
        setSelectedMessageDetail(msg)
        setShowMessageInfoModal(true)
    }

    const handleDeleteForMe = async (msg) => {
        try {
            // Optimistic update
            setMessages(prev => prev.filter(m => m.id !== msg.id))
            await messagingService.hideMessage(msg.id)
        } catch (err) {
            console.error('Delete message error:', err)
            // Rollback if needed (though usually not critical for "delete for me")
        }
    }

    const upsertConversation = (prev, chatObj) => {
        if (!chatObj?.id) return prev
        const next = [chatObj, ...(prev || []).filter(c => String(c?.id) !== String(chatObj.id))]
        // Also drop any accidental duplicates by id (defensive)
        const seen = new Set()
        return next.filter(c => {
            const id = String(c?.id ?? '')
            if (!id || seen.has(id)) return false
            seen.add(id)
            return true
        })
    }

    useEffect(() => {
        if (authLoading || !currentUser || !socket) return

        const init = async () => {
            // Listen for messages
            socket.on('receive_message', handleReceiveMessage)
            socket.on('new_message_notification', handleReceiveMessage)
            socket.on('typing_start', handleTypingStart)
            socket.on('typing_stop', handleTypingStop)

            await loadConversations(currentUser.id)
        }

        init()

        return () => {
            if (socket) {
                socket.off('receive_message', handleReceiveMessage)
                socket.off('new_message_notification', handleReceiveMessage)
                socket.off('typing_start', handleTypingStart)
                socket.off('typing_stop', handleTypingStop)
            }
        }
    }, [authLoading, currentUser?.id, socket])

    const loadConversations = async (currentUserId) => {
        try {
            setLoading(true)
            const data = await messagingService.getConversations()
            const listRaw = Array.isArray(data) ? data : []
            // Deduplicate by conversation id (backend or client can accidentally produce duplicates)
            const seenIds = new Set()
            const list = listRaw.filter(c => {
                const id = c?.id
                if (!id) return false
                const key = String(id)
                if (seenIds.has(key)) return false
                seenIds.add(key)
                return true
            })

            // Enrich conversations with user profiles
            // Collect all OTHER user IDs
            const otherUserIds = new Set()
            list.forEach(c => {
                c.participants.forEach(p => {
                    if (p.userId !== currentUserId) otherUserIds.add(p.userId)
                })
            })

            let users = []
            try {
                users = await userService.getUsers(Array.from(otherUserIds))
            } catch (err) {
                console.warn('Failed to fetch user profiles for conversations, using fallbacks:', err?.response?.data || err?.message)
            }
            const userMap = {}
            ;(Array.isArray(users) ? users : []).forEach(u => {
                const normalized = normalizeUser(u)
                if (normalized?.id) userMap[normalized.id] = normalized
            })

            const enriched = list.map(c => {
                if (!c.participants) return null
                const otherParticipant = c.participants.find(p => p.userId !== currentUserId)
                const otherUser = (otherParticipant && userMap[otherParticipant.userId]) || { id: 'unknown', name: 'Unknown', handle: 'unknown' }
                
                const lastMsg = c.lastMessage || {}
                const raw = lastMsg.content || (lastMsg.mediaUrl ? "Sent an attachment" : "")
                const lastMessageFromMe = lastMsg.senderId === currentUserId

                return {
                    id: c.id,
                    user: otherUser,
                    lastMessage: raw,
                    lastMessageFromMe,
                    timestamp: formatRelativeTime(c.lastMessageAt || c.updatedAt),
                    unread: false // logic for unread count pending
                }
            }).filter(Boolean)

            // Ensure no duplicates by other user id in UI list (one sidebar entry per contact)
            const uniq = []
            const seenUserIds = new Set()
            for (const c of enriched) {
                const otherUserId = String(c.user?.id || 'unknown')
                if (!seenUserIds.has(otherUserId) || otherUserId === 'unknown') {
                    seenUserIds.add(otherUserId)
                    uniq.push(c)
                }
            }
            setConversations(uniq)

            // Restore last opened conversation after refresh
            try {
                const lastId = localStorage.getItem('werfie:lastConversationId')
                if (lastId && !selectedChat) {
                    const match = enriched.find(c => String(c.id) === String(lastId))
                    if (match) setSelectedChat(match)
                }
            } catch { /* ignore */ }
        } catch (error) {
            console.error("Failed to load conversations", error)
        } finally {
            setLoading(false)
        }
    }

    const handleReceiveMessage = async (message) => {
        // Update messages if selected chat
        setSelectedChat(prev => {
            // Force string comparison for safety
            if (prev && String(prev.id) === String(message.conversationId)) {
                setMessages(msgs => {
                    // 1. Check for exact ID match (duplicates)
                    if (msgs.some(m => String(m.id) === String(message.id))) {
                        return msgs;
                    }

                    // 2. Check for Optimistic Match (Sender matches + Content matches + Recent)
                    const isOwnMessage = message.senderId === currentUser?.id;
                    if (isOwnMessage) {
                        // Find a temp ID message (optimistic) with same content/media
                        // Temp IDs are pure-digit strings from Date.now(), real UUIDs contain dashes
                        const isOptimisticId = (id) => typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id));
                        const optimisticMatchIndex = msgs.findIndex(m =>
                            isOptimisticId(m.id) &&
                            ((m.text === message.content) || (m.mediaUrl && m.mediaUrl === message.mediaUrl))
                        );

                        if (optimisticMatchIndex !== -1) {
                            const newMsgs = [...msgs];
                            newMsgs[optimisticMatchIndex] = formatMessage(message);
                            return newMsgs;
                        }
                    }

                    return [...msgs, formatMessage(message)]
                })

                // Mark as read immediately if window focused (simplified)
                socketService.markRead(message.conversationId, [message.id])
            }
            return prev
        })

        // Update conversation list
        setConversations(prev => {
            const existingIndex = prev.findIndex(c => c.id === message.conversationId)

            if (existingIndex > -1) {
                const updatedConversations = [...prev]
                const conversation = updatedConversations[existingIndex]

                // Update conversation details
                let previewText = "Attachment";
                if (message.content) previewText = message.content;
                else if (message.type === 'image') previewText = "Sent an image";
                else if (message.type === 'video') previewText = "Sent a video";
                else if (message.type === 'audio') previewText = "Sent an audio clip";

                updatedConversations[existingIndex] = {
                    ...conversation,
                    lastMessage: previewText,
                    lastMessageFromMe: message.senderId === currentUser?.id,
                    timestamp: formatRelativeTime(message.createdAt),
                    unread: selectedChat?.id !== message.conversationId
                }

                // Move to top
                updatedConversations.sort((a, b) => {
                    if (a.id === message.conversationId) return -1
                    if (b.id === message.conversationId) return 1
                    return 0
                })

                return updatedConversations

            } else {
                // Conversation not found in list -> Fetch it!
                fetchNewConversation(message.conversationId)
                return prev
            }
        })
    }

    const fetchNewConversation = async (conversationId) => {
        try {
            const newConv = await messagingService.getConversation(conversationId)

            // Normalize for frontend
            if (!newConv.participants) return
            const otherParticipant = newConv.participants.find(p => p.userId !== currentUser.id)
            // Ideally we need user details here. 
            // If participant has no user detail in response (depends on backend include), we fetch user.
            let userData = { id: 'unknown', name: 'Unknown' }

            if (otherParticipant) {
                const users = await userService.getUsers([otherParticipant.userId])
                if (users.length > 0) userData = normalizeUser(users[0])
            }

            const lastMsg = newConv.lastMessage || {}
            const chatObj = {
                id: newConv.id,
                user: userData,
                lastMessage: lastMsg.content || (lastMsg.mediaUrl ? "Sent an attachment" : "New Message"),
                lastMessageFromMe: lastMsg.senderId === currentUser?.id,
                timestamp: formatRelativeTime(newConv.lastMessageAt || newConv.updatedAt),
                unread: true
            }

            setConversations(prev => upsertConversation(prev, chatObj))
        } catch (error) {
            console.error("Failed to fetch new conversation", error)
        }
    }

    const handleTypingStart = ({ conversationId, userId }) => {
        // Show typing indicator
    }

    const handleTypingStop = ({ conversationId, userId }) => {
        // Hide typing indicator
    }

    // Load messages when selecting chat
    useEffect(() => {
        if (!selectedChat) return
        try { localStorage.setItem('werfie:lastConversationId', String(selectedChat.id)) } catch { /* ignore */ }

        const fetchMessages = async () => {
            try {
                const msgs = await messagingService.getMessages(selectedChat.id)
                setMessages(msgs.map(formatMessage))
                socketService.joinConversation(selectedChat.id)
            } catch (error) {
                console.error("Failed to load messages", error)
            }
        }

        fetchMessages()

        return () => {
            socketService.leaveConversation(selectedChat.id)
        }
    }, [selectedChat?.id])

    // Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            const timeout = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [messages, mediaAttachment])


    const formatMessage = (msg) => ({
        id: msg.id,
        sender: msg.senderId === currentUser?.id ? "me" : "them",
        text: msg.content,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.type,
        thumbnailUrl: msg.thumbnailUrl,
        duration: msg.duration,
        createdAt: msg.createdAt,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([])
                return
            }
            try {
                const results = await searchService.searchUsers(searchQuery)
                setSearchResults(results)
            } catch (error) {
                console.error("Search failed", error)
            }
        }

        const debounceTimer = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    // Load following users when New Message modal opens
    useEffect(() => {
        if (showNewMessageModal && currentUser?.id) {
            userService.getFollowing(currentUser.id, { limit: 100 })
                .then(data => setFollowingUsers(Array.isArray(data) ? data : []))
                .catch(() => setFollowingUsers([]))
            setModalSearchQuery("")
            setModalSearchResults([])
        }
    }, [showNewMessageModal, currentUser?.id])

    // Modal search: search available users
    useEffect(() => {
        if (!modalSearchQuery.trim()) {
            setModalSearchResults([])
            return
        }
        const search = async () => {
            try {
                const results = await searchService.searchUsers(modalSearchQuery, { limit: 50 })
                setModalSearchResults(Array.isArray(results) ? results : [])
            } catch {
                setModalSearchResults([])
            }
        }
        const t = setTimeout(search, 300)
        return () => clearTimeout(t)
    }, [modalSearchQuery])

    const startChatWithUser = async (user, closeModal = false) => {
        if (closeModal) setShowNewMessageModal(false)
        if (!currentUser) {
            toast.error("User not logged in")
            return
        }

        try {
            const normalizedUser = normalizeUser(user)
            const recipientId = normalizedUser.id

            if (!recipientId) {
                toast.error("Invalid user selection: Missing ID")
                console.error("Invalid user object:", user)
                return
            }

            toast.info(`Attempting chat with ${normalizedUser.name}...`)

            const existing = conversations.find(c => c.user.id === recipientId)

            if (existing) {
                setSelectedChat(existing)
                toast.success("Opened existing conversation")
            } else {
                // Create on backend
                const newConv = await messagingService.createConversation(recipientId)

                const chatObj = {
                    id: newConv.id,
                    user: normalizedUser,
                    lastMessage: "",
                    lastMessageFromMe: false,
                    timestamp: "New",
                    unread: false
                }

                setConversations(prev => upsertConversation(prev, chatObj))
                setSelectedChat(chatObj)
                toast.success("New conversation started")
            }
        } catch (error) {
            console.error("Failed to start chat", error)
            toast.error(`Start Chat Error: ${error.response?.data?.error || error.message}`)
        } finally {
            if (!closeModal) {
                setSearchQuery("")
                setSearchResults([])
            }
        }
    }

    const handleModalUserSelect = (user) => {
        startChatWithUser(user, true)
    }

    // Handle navigation from profile page
    useEffect(() => {
        if (location.state?.userId && currentUser) {
            const { userId, userName, userHandle } = location.state
            startChatWithUser({ id: userId, name: userName, handle: userHandle })

            // Clear the navigation state
            window.history.replaceState({}, document.title)
        }
    }, [location.state, currentUser])

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji)
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading("Uploading media...")

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await messagingService.uploadMedia(formData)

            let type = 'image';
            if (file.type.startsWith('video/')) type = 'video';
            if (file.type.startsWith('audio/')) type = 'audio';

            setMediaAttachment({
                url: response.url,
                thumbnailUrl: response.thumbnailUrl,
                duration: response.duration,
                size: response.size,
                mimeType: response.mimeType,
                type
            })

            toast.success("Media uploaded", { id: toastId })
        } catch (error) {
            console.error("Upload failed", error)
            toast.error("Failed to upload media", { id: toastId })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleSendMessage = () => {
        if ((!newMessage.trim() && !mediaAttachment) || !selectedChat) return
        const payload = {
            conversationId: selectedChat.id,
            content: newMessage,
            type: mediaAttachment ? mediaAttachment.type : 'text',
            mediaUrl: mediaAttachment?.url,
            thumbnailUrl: mediaAttachment?.thumbnailUrl,
            duration: mediaAttachment?.duration,
            size: mediaAttachment?.size,
            mimeType: mediaAttachment?.mimeType,
            replyToId: replyingTo?.id
        }

        // Optimistic update
        const tempMsg = {
            id: Date.now().toString(), // Temporary ID
            senderId: currentUser.id,
            content: newMessage || '',
            type: payload.type,
            mediaUrl: payload.mediaUrl,
            thumbnailUrl: payload.thumbnailUrl,
            duration: payload.duration,
            size: payload.size,
            mimeType: payload.mimeType,
            replyToId: payload.replyToId,
            createdAt: new Date().toISOString()
        }

        setMessages(prev => [...prev, formatMessage(tempMsg)])

        // Emit socket
        socketService.sendMessage(payload)

        setNewMessage("")
        setMediaAttachment(null)
        setReplyingTo(null)
        setShowEmojiPicker(false)
    }

    const handleForwardAction = async (targetConvId) => {
        if (!forwardingMessage) return
        try {
            toast.loading("Forwarding message...")
            await messagingService.forwardMessage(forwardingMessage.id, targetConvId)
            toast.dismiss()
            toast.success("Message forwarded")
            setShowForwardModal(false)
            setForwardingMessage(null)
        } catch (err) {
            toast.dismiss()
            toast.error("Failed to forward message")
        }
    }

    const modalDisplayUsers = modalSearchQuery.trim() ? modalSearchResults : followingUsers

    return (
        <>
            <div className="grid grid-cols-[minmax(280px,30%)_1fr] h-screen max-h-screen">
                {/* Left Panel: Conversations */}
                <div className="min-w-0 border-r border-border overflow-y-auto bg-black flex flex-col">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-black border-b border-border">
                        <div className="px-4 py-3 flex justify-between items-center">
                            <h1 className="text-[22px] font-bold tracking-tight">{t('nav.chat') || 'Chat'}</h1>
                            <div className="flex gap-0.5">
                                <button type="button"
                                    onClick={() => navigate("/chat/settings")}
                                    className="p-2.5 hover:bg-white/[0.06] rounded-full transition-colors text-muted-foreground hover:text-white"
                                >
                                    <Settings className="w-6 h-6" />
                                </button>
                                <button type="button"
                                    onClick={() => setShowNewMessageModal(true)}
                                    className="p-2.5 hover:bg-white/[0.06] rounded-full transition-colors text-muted-foreground hover:text-white"
                                >
                                    <MessageSquarePlus className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="px-4 pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search"
                                    className="w-full bg-[#16181c] border border-transparent rounded-lg pl-10 h-10 text-[15px] text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:border-white/20"
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 px-4 pb-3">
                            <button type="button"
                                onClick={() => setActiveTab("all")}
                                className={cn(
                                    "px-4 py-2 font-medium text-[15px] rounded-full transition-colors",
                                    activeTab === "all" ? "bg-white/[0.12] text-white" : "text-muted-foreground hover:text-white hover:bg-white/[0.06]"
                                )}
                            >
                                All
                            </button>
                            <button type="button"
                                onClick={() => setActiveTab("requests")}
                                className={cn(
                                    "px-4 py-2 font-medium text-[15px] rounded-full transition-colors",
                                    activeTab === "requests" ? "bg-white/[0.12] text-white" : "text-muted-foreground hover:text-white hover:bg-white/[0.06]"
                                )}
                            >
                                Requests
                            </button>
                        </div>
                    </div>

                    {/* Conversation List */}


                    {/* Conversation List or Search Results */}
                    <div className="flex flex-col flex-1 min-h-0">
                        {searchQuery.trim() ? (
                            /* Search Results */
                            searchResults.length > 0 ? (
                                searchResults.map((user) => {
                                    const normalized = normalizeUser(user);
                                    return (
                                        <button
                                            type="button"
                                            key={normalized.id}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); startChatWithUser(user); }}
                                            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-r-2 border-transparent active:bg-white/10 text-left bg-transparent border-y-0 border-l-0"
                                        >
                                            <Avatar className="w-10 h-10 border border-border pointer-events-none">
                                                <AvatarImage src={getMediaUrl(normalized.avatar)} />
                                                <AvatarFallback>{(normalized.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 pointer-events-none">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-[16px] truncate">{normalized.name}</span>
                                                    {normalized.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                                                </div>
                                                <span className="text-muted-foreground text-[15px]">@{normalized.handle}</span>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center text-muted-foreground">
                                    No users found
                                </div>
                            )
                        ) : loading ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
                                <Mail className="w-16 h-16 text-muted-foreground/60 mb-4" strokeWidth={1.2} />
                                <p className="font-semibold text-[17px] text-white mb-1">Empty inbox</p>
                                <p className="text-[14px] text-muted-foreground">Message someone to get started</p>
                            </div>
                        ) : (
                            /* Conversations */
                            conversations.map((chat) => (
                                <button
                                    type="button"
                                    key={chat.id}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedChat(chat); }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-r-2 text-left bg-transparent border-y-0 border-l-0",
                                        selectedChat?.id === chat.id ? "bg-white/[0.06] border-blue-500" : "border-transparent"
                                    )}
                                >
                                    <Avatar className="w-12 h-12 border border-border shrink-0">
                                        <AvatarImage src={getMediaUrl(chat.user.avatar)} />
                                        <AvatarFallback>{chat.user.name?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span className="font-bold text-[16px] truncate">{chat.user.name}</span>
                                                {chat.user.verified && <BadgeCheck className="w-4 h-4 text-[#ffd700] fill-[#ffd700]/20 shrink-0" />}
                                            </div>
                                            <span className="text-muted-foreground text-[14px] shrink-0">{chat.timestamp}</span>
                                        </div>
                                        <p className={cn("text-[15px] truncate mt-0.5", chat.unread ? "text-white font-medium" : "text-muted-foreground")}>
                                            {chat.lastMessage ? (chat.lastMessageFromMe ? `You: ${chat.lastMessage}` : chat.lastMessage) : t('chat.start_conversation')}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel: Chat Window */}
                <div className="flex-1 flex flex-col h-screen bg-black">
                    {selectedChat ? (
                        <>
                            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md px-4 h-14 border-b border-border flex items-center justify-between">
                                <button type="button"
                                    onClick={() => setShowUserInfoModal(true)}
                                    className="flex items-center gap-1"
                                >
                                    <h2 className="text-[19px] font-bold text-white hover:underline truncate text-left">{selectedChat.user.name}</h2>
                                    {selectedChat.user.verified && <BadgeCheck className="w-[18px] h-[18px] text-[#ffd700] fill-[#ffd700]/20" />}
                                </button>
                                <button type="button"
                                    onClick={() => setShowUserInfoModal(true)}
                                    className="w-[34px] h-[34px] flex items-center justify-center hover:bg-white/[0.1] rounded-full transition-colors text-white"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                                {/* Profile Info in Chat */}
                                <div className="flex flex-col items-center justify-center pt-10 pb-16 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-border" onClick={() => navigate(`/profile/${selectedChat.user.id}`)}>
                                    <Avatar className="w-[120px] h-[120px] mb-3 relative overflow-hidden bg-black">
                                        <AvatarImage src={getMediaUrl(selectedChat.user.avatar)} className="object-cover" />
                                        <AvatarFallback className="text-4xl bg-[#ff3366] font-bold text-white">{selectedChat.user.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-[20px] font-bold flex items-center gap-1 mb-0 leading-tight">
                                        {selectedChat.user.name}
                                        {selectedChat.user.verified && <BadgeCheck className="w-5 h-5 text-[#ffd700] fill-[#ffd700]/20" />}
                                    </h3>
                                    <p className="text-[#71767b] text-[15px] mb-1">@{selectedChat.user.handle}</p>
                                    <p className="text-[#71767b] text-[15px] mb-4">{formatJoinedDate(selectedChat.user.createdAt)}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full bg-white hover:bg-[#d7dbdc] text-black font-bold px-6 h-[34px] border-none text-[15px] transition-colors"
                                    >
                                        View Profile
                                    </Button>
                                </div>

                                {messages.map((msg, idx) => {
                                    const prev = messages[idx - 1]
                                    const thisDay = formatDayLabel(msg.createdAt)
                                    const prevDay = prev ? formatDayLabel(prev.createdAt) : null
                                    const showDay = thisDay && thisDay !== prevDay

                                    return (
                                        <div key={msg.id} className="contents">
                                            {showDay && (
                                                <div className="flex items-center justify-center py-3">
                                                    <span className="text-muted-foreground text-[13px] font-medium">{thisDay}</span>
                                                </div>
                                            )}

                                            <div
                                                className={cn(
                                                    "flex flex-col max-w-[70%]",
                                                    msg.sender === "me" ? "self-end items-end" : "self-start items-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "px-3.5 py-2.5 text-[15px] leading-[20px] relative group",
                                                        msg.sender === "me"
                                                            ? "bg-[#1d9bf0] text-white rounded-[22px] rounded-br-[4px]"
                                                            : "bg-[#2f3336] text-[#e7e9ea] rounded-[22px] rounded-bl-[4px]"
                                                    )}
                                                >
                                                    {msg.mediaUrl && (
                                                        msg.mediaType === 'video' ? (
                                                            <div className="relative mb-1">
                                                                <video
                                                                    src={getMediaUrl(msg.mediaUrl)}
                                                                    controls
                                                                    poster={getMediaUrl(msg.thumbnailUrl)}
                                                                    className="rounded-2xl max-h-[300px] w-full object-cover bg-black"
                                                                />
                                                                {msg.duration && (
                                                                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] font-bold px-1.5 rounded">
                                                                        {new Date(msg.duration * 1000).toISOString().substr(14, 5)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : msg.mediaType === 'audio' ? (
                                                            <div className="w-[220px] bg-black/20 rounded-2xl p-2 mb-1">
                                                                <audio src={getMediaUrl(msg.mediaUrl)} controls className="w-full h-8" />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={getMediaUrl(msg.mediaUrl)}
                                                                alt="Attachment"
                                                                className="rounded-2xl mb-1 max-h-[300px] w-full object-cover"
                                                            />
                                                        )
                                                    )}

                                                    <div className="flex items-end gap-2 flex-wrap min-w-0 pointer-events-none">
                                                        {msg.text ? <span className="whitespace-pre-wrap break-words">{msg.text}</span> : null}
                                                        
                                                        {/* Timestamp next to text */}
                                                        <span className="shrink-0 text-[11px] text-white/70 ml-auto flex items-center gap-[3px] select-none h-[20px]">
                                                            {msg.timestamp}
                                                            {msg.sender === "me" && <Check className="w-[13px] h-[13px]" strokeWidth={2.5} />}
                                                        </span>
                                                    </div>
                                                    {/* Hover options... (Made visible explicitly per request & mobile friendly) */}
                                                    <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1" style={{[msg.sender === "me" ? "left" : "right"]: "-38px"}}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className="h-[26px] w-[26px] rounded-full border border-[#2f3336] bg-black flex items-center justify-center text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#16181c] transition-colors" title="More">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent 
                                                                align={msg.sender === "me" ? "end" : "start"} 
                                                                side="bottom" 
                                                                className="w-[260px] bg-black border-[#2f3336] rounded-2xl p-0 shadow-xl shadow-black/50 py-1"
                                                            >
                                                                 <DropdownMenuItem className="flex items-center gap-3 px-4 py-[14px] cursor-pointer text-[#e7e9ea] focus:bg-white/[0.03] focus:text-white font-bold text-[15px] rounded-none outline-none border-none" onClick={() => handleReply(msg)}>
                                                                    <MessageCircle className="w-5 h-5 text-[#71767b] absolute left-4" strokeWidth={2} />
                                                                    <span className="ml-[34px]">Reply</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-[14px] cursor-pointer text-[#e7e9ea] focus:bg-white/[0.03] focus:text-white font-bold text-[15px] rounded-none outline-none border-none" onClick={() => handleForward(msg)}>
                                                                    <Forward className="w-5 h-5 text-[#71767b] absolute left-4" strokeWidth={2} />
                                                                    <span className="ml-[34px]">Forward</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-[14px] cursor-pointer text-[#e7e9ea] focus:bg-white/[0.03] focus:text-white font-bold text-[15px] rounded-none outline-none border-none" onClick={() => navigator.clipboard.writeText(msg.text || '')}>
                                                                    <Copy className="w-5 h-5 text-[#71767b] absolute left-4" strokeWidth={2} />
                                                                    <span className="ml-[34px]">Copy message text</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-[14px] cursor-pointer text-[#e7e9ea] focus:bg-white/[0.03] focus:text-white font-bold text-[15px] rounded-none outline-none border-none" onClick={() => handleInfo(msg)}>
                                                                    <Info className="w-5 h-5 text-[#71767b] absolute left-4" strokeWidth={2} />
                                                                    <span className="ml-[34px]">Info</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="flex items-center gap-3 px-4 py-[14px] cursor-pointer text-[#f4212e] focus:bg-[#f4212e]/10 focus:text-[#f4212e] font-bold text-[15px] rounded-none outline-none border-none" onClick={() => handleDeleteForMe(msg)}>
                                                                    <Trash2 className="w-5 h-5 text-[#f4212e] absolute left-4" strokeWidth={2} />
                                                                    <span className="ml-[34px]">Delete for me</span>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 border-t border-border bg-black relative">
                                {/* Reply Preview */}
                                {replyingTo && (
                                    <div className="flex items-center justify-between bg-[#16181c] p-3 border-b border-border animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex flex-col gap-0.5 min-w-0 border-l-[3px] border-[#1d9bf0] pl-3">
                                            <span className="text-[13px] text-[#71767b]">Replying to {replyingTo.sender === 'me' ? 'yourself' : 'them'}</span>
                                            <span className="text-[14px] text-[#e7e9ea] truncate max-w-full italic">"{replyingTo.text}"</span>
                                        </div>
                                        <button 
                                            onClick={() => setReplyingTo(null)}
                                            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#71767b] hover:text-[#e7e9ea] transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Emoji Picker Popover */}
                                {showEmojiPicker && (
                                    <div className="absolute bottom-20 left-4 z-50">
                                        <EmojiPicker theme="dark" onEmojiClick={handleEmojiClick} />
                                    </div>
                                )}

                                {/* Media Preview */}
                                {mediaAttachment && (
                                    <div className="absolute bottom-full left-0 w-full bg-black/90 p-3 border-t border-border flex items-center gap-3">
                                        <div className="relative group">
                                            {mediaAttachment.type === 'video' ? (
                                                <video src={getMediaUrl(mediaAttachment.url)} className="h-20 w-20 object-cover rounded-lg border border-border" />
                                            ) : mediaAttachment.type === 'audio' ? (
                                                <div className="h-20 w-40 flex items-center justify-center bg-gray-800 rounded-lg border border-border">
                                                    <span className="text-xs text-muted-foreground">Audio Clip</span>
                                                </div>
                                            ) : (
                                                <img src={getMediaUrl(mediaAttachment.url)} className="h-20 w-20 object-cover rounded-lg border border-border" />
                                            )}

                                            <button
                                                onClick={() => setMediaAttachment(null)}
                                                className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-border hover:bg-zinc-700"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('feed.media_attached')}</div>
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5 px-3 py-1">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                        accept="image/*,video/*,audio/*"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-white/10 text-white/80 hover:text-white rounded-full h-10 w-10 shrink-0 bg-[#202327]"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        title="Attach file"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-white/10 text-white/80 hover:text-white rounded-full h-10 w-10 shrink-0 bg-[#202327]"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        title="Attach media"
                                    >
                                        <Link2 className="w-[18px] h-[18px]" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "rounded-full h-10 w-10 shrink-0 text-white/80 hover:text-white hover:bg-white/10 bg-[#202327]",
                                            showEmojiPicker ? "bg-white/20 text-white" : ""
                                        )}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        title="Emoji"
                                    >
                                        <Smile className="w-[18px] h-[18px]" />
                                    </Button>
                                    
                                    <div className="bg-[#202327] rounded-full flex items-center px-4 py-0 flex-1 h-[42px] ml-1">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Unencrypted message"
                                            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-[#e7e9ea] placeholder:text-[#71767b] px-0 h-full text-[15px]"
                                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        />
                                        {(newMessage.trim() || mediaAttachment) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full h-8 w-8 shrink-0 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 ml-1"
                                                onClick={handleSendMessage}
                                                disabled={isUploading}
                                                title="Send"
                                            >
                                                <Send className="w-4 h-4 ml-[2px]" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
                            <div className="max-w-[400px]">
                                <div className="w-24 h-24 mb-6 mx-auto rounded-full border border-white/10 flex items-center justify-center bg-transparent">
                                    <Mail className="w-12 h-12 text-muted-foreground" strokeWidth={1.2} />
                                </div>
                                <h2 className="text-[22px] font-bold mb-2 text-white">Start Conversation</h2>
                                <p className="text-[14px] text-muted-foreground mb-8">Choose from your existing conversations, or start a new one.</p>
                                <Button
                                    onClick={() => setShowNewMessageModal(true)}
                                    variant="outline"
                                    className="rounded-full border-white/20 bg-transparent hover:bg-white/[0.06] text-white font-medium px-6 h-11 text-[15px]"
                                >
                                    New chat
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Message Modal */}
            <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
                <DialogContent className="sm:max-w-[500px] bg-black border-border p-0 overflow-hidden [&>button]:hidden">
                    <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-xl font-bold">New message</DialogTitle>
                        <DialogDescription className="sr-only">Search for a user to start a conversation</DialogDescription>
                        <button
                            onClick={() => setShowNewMessageModal(false)}
                            className="p-2 hover:bg-white/[0.06] rounded-full transition-colors text-muted-foreground hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </DialogHeader>
                    <div className="flex flex-col max-h-[85vh]">
                        <div className="p-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={modalSearchQuery}
                                    onChange={(e) => setModalSearchQuery(e.target.value)}
                                    placeholder="Search name or username"
                                    className="w-full bg-transparent border border-blue-500/50 rounded-lg pl-10 h-10 text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                                />
                            </div>
                            <button type="button" className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-[15px] font-medium">
                                <Users2 className="w-4 h-4" />
                                Create a group
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto border-t border-border max-h-[50vh]">
                            {modalDisplayUsers.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    {modalSearchQuery.trim() ? "No users found" : "No people to message yet. Follow someone first."}
                                </div>
                            ) : (
                                modalDisplayUsers.map((u) => {
                                    const normalized = normalizeUser(u)
                                    if (normalized.id === currentUser?.id) return null
                                    return (
                                        <button
                                            type="button"
                                            key={normalized.id}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleModalUserSelect(u); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors text-left bg-transparent border-0"
                                        >
                                            <Avatar className="w-10 h-10 border border-border">
                                                <AvatarImage src={getMediaUrl(normalized.avatar)} />
                                                <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(normalized.name || normalized.id))}>{(normalized.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-[16px] truncate">{normalized.name}</span>
                                                    {normalized.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0" />}
                                                </div>
                                                <span className="text-muted-foreground text-[15px]">@{normalized.handle}</span>
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* User Info Modal */}
            {selectedChat && (
                <Dialog open={showUserInfoModal} onOpenChange={setShowUserInfoModal}>
                    <DialogContent className="sm:max-w-[480px] w-[95vw] bg-[#16181c] border-border p-0 overflow-hidden rounded-2xl [&>button]:hidden">
                        <DialogTitle className="sr-only">User profile: {selectedChat.user.name}</DialogTitle>
                        <DialogDescription className="sr-only">Profile and options for @{selectedChat.user.handle}</DialogDescription>
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between p-5 border-b border-border">
                                <button
                                    onClick={() => setShowUserInfoModal(false)}
                                    className="p-2.5 -ml-2 hover:bg-white/[0.06] rounded-full transition-colors text-white"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                <button className="p-2.5 -mr-2 hover:bg-white/[0.06] rounded-full transition-colors text-muted-foreground hover:text-white">
                                    <Link2 className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex flex-col items-center pt-8 pb-6 px-8">
                                <Avatar className="w-28 h-28 mb-5 border-2 border-border">
                                    <AvatarImage src={getMediaUrl(selectedChat.user.avatar)} />
                                    <AvatarFallback className={cn("text-white font-semibold text-3xl", getAvatarColor(selectedChat.user.name || selectedChat.user.id))}>{selectedChat.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-[22px] font-bold flex items-center gap-1.5 mb-1">
                                    {selectedChat.user.name}
                                    {selectedChat.user.verified && <BadgeCheck className="w-6 h-6 text-[#ffd700] fill-[#ffd700]/20" />}
                                </h3>
                                <p className="text-muted-foreground text-[16px] mb-8">@{selectedChat.user.handle}</p>
                                <div className="grid grid-cols-4 gap-8 w-full max-w-[320px]">
                                    <button className="flex flex-col items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                                        <div className="w-14 h-14 rounded-full bg-white/[0.08] flex items-center justify-center">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <span className="text-[14px] font-medium">Voice</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                                        <div className="w-14 h-14 rounded-full bg-white/[0.08] flex items-center justify-center">
                                            <Video className="w-6 h-6" />
                                        </div>
                                        <span className="text-[14px] font-medium">Video</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowUserInfoModal(false); navigate(`/profile/${selectedChat.user.id}`) }}
                                        className="flex flex-col items-center gap-3 text-muted-foreground hover:text-white transition-colors"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-white/[0.08] flex items-center justify-center">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <span className="text-[14px] font-medium">Profile</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-3 text-muted-foreground hover:text-white transition-colors">
                                        <div className="w-14 h-14 rounded-full bg-white/[0.08] flex items-center justify-center">
                                            <MoreVertical className="w-6 h-6" />
                                        </div>
                                        <span className="text-[14px] font-medium">More</span>
                                    </button>
                                </div>
                            </div>
                            <div className="border-t border-border px-5 py-3">
                                <button className="w-full flex items-center gap-3 py-3.5 text-[16px] text-white hover:bg-white/[0.04] rounded-lg px-3 transition-colors">
                                    <Clock className="w-6 h-6 text-muted-foreground" />
                                    <span className="flex-1 text-left">Disappearing Messages</span>
                                    <span className="text-muted-foreground text-[15px]">Off</span>
                                    <span className="text-muted-foreground">&gt;</span>
                                </button>
                                <button className="w-full flex items-center gap-3 py-3.5 text-[16px] text-white hover:bg-white/[0.04] rounded-lg px-3 transition-colors">
                                    <CameraOff className="w-6 h-6 text-muted-foreground" />
                                    <span className="flex-1 text-left">Block Screenshots</span>
                                    <span className="text-muted-foreground text-[15px]">Off</span>
                                    <span className="text-muted-foreground">&gt;</span>
                                </button>
                                <button className="w-full flex items-center gap-3 py-3.5 text-[16px] text-red-500 hover:bg-red-500/10 rounded-lg px-3 transition-colors">
                                    <Ban className="w-6 h-6" />
                                    <span className="flex-1 text-left">Block Messages</span>
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            {/* Forward Message Modal */}
            {showForwardModal && (
                <div className="fixed inset-0 z-[100] bg-[#5b7083]/40 flex items-center justify-center p-4">
                    <div className="bg-black w-full max-w-[600px] h-[650px] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#2f3336]">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => { setShowForwardModal(false); setForwardingMessage(null); }}
                                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                                <h2 className="text-[20px] font-bold text-white">Forward message</h2>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                           <div className="space-y-4">
                               <p className="text-[#71767b] text-[15px] px-2">Select a conversation to forward this message to.</p>
                               {conversations.map(c => {
                                   // `conversations` state ko `loadConversations()` me enrich kiya jata hai,
                                   // jahan contact user ko `c.user` me diya hota hai (na ki participants array me).
                                   // Forward modal me isi ko use karo, warna name/handle blank aa sakte hain.
                                   const otherUser =
                                       c.user ||
                                       (c.participants || []).find(p => String(p.user?.id) !== String(currentUser?.id))?.user ||
                                       {}

                                   const displayName = otherUser.name || otherUser.profile?.name || 'Unknown'
                                   const displayHandle = otherUser.handle || otherUser.profile?.handle || otherUser.username || 'unknown'
                                   const avatarSrc = otherUser.avatar || otherUser.profile?.avatar || null
                                   return (
                                       <button 
                                           key={c.id}
                                           onClick={() => handleForwardAction(c.id)}
                                           className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group text-left"
                                       >
                                           <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                                               {avatarSrc ? (
                                                   <img src={getMediaUrl(avatarSrc)} className="w-full h-full object-cover" />
                                               ) : (
                                                   (displayName?.[0] || 'U').toUpperCase()
                                               )}
                                           </div>
                                           <div className="min-w-0">
                                               <div className="font-bold text-[15px] text-white truncate">{displayName}</div>
                                               <div className="text-[14px] text-[#71767b] truncate">@{displayHandle}</div>
                                           </div>
                                           <ArrowRight className="ml-auto w-5 h-5 text-[#71767b] group-hover:text-primary transition-colors" />
                                       </button>
                                   )
                               })}
                           </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Info Modal */}
            {showMessageInfoModal && selectedMessageDetail && (
                <div className="fixed inset-0 z-[100] bg-[#5b7083]/40 flex items-center justify-center p-4">
                    <div className="bg-black w-full max-w-[400px] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-[#2f3336]">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-[#2f3336]">
                            <h2 className="text-[18px] font-bold text-white">Message Info</h2>
                            <button 
                                onClick={() => { setShowMessageInfoModal(false); setSelectedMessageDetail(null); }}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-1">
                                <p className="text-[13px] text-[#71767b] uppercase font-bold tracking-tight">Status</p>
                                <div className="flex items-center gap-2 text-white">
                                    <span className="capitalize">{selectedMessageDetail.status || 'Sent'}</span>
                                    {selectedMessageDetail.sender === 'me' && (
                                        <div className="flex">
                                            <Check className="w-4 h-4 text-[#1d9bf0]" />
                                            {selectedMessageDetail.status === 'read' && <Check className="w-4 h-4 -ml-2 text-[#1d9bf0]" />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[13px] text-[#71767b] uppercase font-bold tracking-tight">Sent at</p>
                                <p className="text-white text-[15px]">
                                    {new Date(selectedMessageDetail.fullDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedMessageDetail.timestamp}
                                </p>
                            </div>

                            {selectedMessageDetail.mediaUrl && (
                                <div className="space-y-1">
                                    <p className="text-[13px] text-[#71767b] uppercase font-bold tracking-tight">Content Type</p>
                                    <p className="text-white text-[15px] capitalize">{selectedMessageDetail.mediaType}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
