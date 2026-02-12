import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Mail, Search, Settings, Image as ImageIcon, Smile, Send, Info, X } from "lucide-react"
import { toast } from "sonner"
import { useState, useRef, useEffect } from "react"
import { cn, getMediaUrl } from "@/lib/utils"
import EmojiPicker from 'emoji-picker-react'
import { mediaService, searchService, messagingService, userService, authService } from "@/services/api"
import { socketService } from "@/services/socket"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"

const normalizeUser = (user) => {
    if (!user) return null;
    return {
        id: user.id || user._id,
        name: user.name || user.profile?.name || 'Unknown',
        handle: user.handle || user.username || user.profile?.handle || 'unknown',
        avatar: user.avatar || user.profile?.avatar,
        verified: user.verified || user.profile?.verified
    };
};

export default function Chat() {
    const { t } = useTranslation()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const { user: authUser, loading: authLoading } = useAuth()
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

    // Initialize Socket & Load Data
    useEffect(() => {
        if (authLoading || !currentUser) return

        const init = async () => {
            // Connect Socket
            const socket = socketService.connect()
            
            if (socket) {
                // Listen for messages
                socket.on('receive_message', handleReceiveMessage)
                socket.on('new_message_notification', handleReceiveMessage)
                socket.on('typing_start', handleTypingStart)
                socket.on('typing_stop', handleTypingStop)
            }

            await loadConversations(currentUser.id)
        }

        init()

        return () => {
            const socket = socketService.getSocket()
            if (socket) {
                socket.off('receive_message')
                socket.off('new_message_notification')
                socket.off('typing_start')
                socket.off('typing_stop')
            }
            socketService.disconnect()
        }
    }, [authLoading, currentUser?.id])

    const loadConversations = async (currentUserId) => {
        try {
            setLoading(true)
            const data = await messagingService.getConversations()
            
            // Enrich conversations with user profiles
            // Collect all OTHER user IDs
            const otherUserIds = new Set()
            data.forEach(c => {
                c.participants.forEach(p => {
                     if (p.userId !== currentUserId) otherUserIds.add(p.userId)
                })
            })

            const users = await userService.getUsers(Array.from(otherUserIds))
            const userMap = {}
            users.forEach(u => {
                const normalized = normalizeUser(u)
                userMap[normalized.id] = normalized
            })

            const enriched = data.map(c => {
                const otherParticipant = c.participants.find(p => p.userId !== currentUserId)
                const otherUser = userMap[otherParticipant?.userId] || { id: 'unknown', name: 'Unknown', handle: 'unknown' }
                
                return {
                    id: c.id,
                    user: otherUser,
                    lastMessage: c.lastMessage?.content || (c.lastMessage?.mediaUrl ? "Sent an attachment" : ""),
                    timestamp: new Date(c.lastMessageAt || c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: false // logic for unread count pending
                }
            })
            
            setConversations(enriched)
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
                        // Find a numeric ID message (optimistic) with same content/media
                        const optimisticMatchIndex = msgs.findIndex(m => 
                            typeof m.id === 'number' && 
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
                    timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
            const otherParticipant = newConv.participants.find(p => p.userId !== currentUser.id)
            // Ideally we need user details here. 
            // If participant has no user detail in response (depends on backend include), we fetch user.
            let userData = { id: 'unknown', name: 'Unknown' }
            
            if (otherParticipant) {
                const users = await userService.getUsers([otherParticipant.userId])
                if (users.length > 0) userData = normalizeUser(users[0])
            }

            const chatObj = {
                id: newConv.id,
                user: userData,
                lastMessage: newConv.lastMessage?.content || "New Message",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: true
            }

            setConversations(prev => [chatObj, ...prev])
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

        const fetchMessages = async () => {
            try {
                const msgs = await messagingService.getMessages(selectedChat.id)
                setMessages(msgs.map(formatMessage))
                socketService.joinConversation(selectedChat.id)
                // Mark read
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

    const startChatWithUser = async (user) => {
        toast.info("Select request received...")
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
                    timestamp: "New",
                    unread: false
                }
                
                setConversations(prev => [chatObj, ...prev])
                setSelectedChat(chatObj)
                toast.success("New conversation started")
            }
        } catch (error) {
            console.error("Failed to start chat", error)
            toast.error(`Start Chat Error: ${error.response?.data?.error || error.message}`)
        } finally {
            setSearchQuery("")
            setSearchResults([])
        }
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
            mimeType: mediaAttachment?.mimeType
        }

        // Optimistic update
        const tempMsg = {
           id: Date.now(), // Temporary ID
           senderId: currentUser.id,
           content: newMessage,
           type: payload.type,
           mediaUrl: payload.mediaUrl,
           thumbnailUrl: payload.thumbnailUrl,
           duration: payload.duration,
           size: payload.size,
           mimeType: payload.mimeType,
           createdAt: new Date().toISOString()
        }
        
        setMessages(prev => [...prev, formatMessage(tempMsg)])
        
        // Emit socket
        socketService.sendMessage(payload)

        setNewMessage("")
        setMediaAttachment(null)
        setShowEmojiPicker(false)
    }

    return (
        <div className="grid grid-cols-[350px_1fr] h-screen max-h-screen">
            {/* Left Panel: Conversations */}
            <div className="w-[350px] border-r border-border overflow-y-auto bg-black">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black border-b border-border">
                    <div className="px-4 py-3 flex justify-between items-center">
                        <h1 className="text-xl font-bold">{t('nav.chat')}</h1>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/[0.03] rounded-full transition-colors">
                                <Settings className="w-5 h-5" />
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
                                placeholder={t('right_sidebar.search_placeholder')}
                                className="w-full bg-[#202327] border-none rounded-full pl-12 h-11 text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 px-4 border-b border-border">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={cn(
                                "pb-3 font-bold text-[15px] relative transition-colors",
                                activeTab === "all" ? "text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {t('notifications.tabs.all')}
                            {activeTab === "all" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            className={cn(
                                "pb-3 font-bold text-[15px] relative transition-colors",
                                activeTab === "requests" ? "text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {t('chat.requests')}
                            {activeTab === "requests" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Conversation List */}


                {/* Conversation List or Search Results */}
                <div className="flex flex-col">
                    {searchQuery.trim() ? (
                        /* Search Results */
                        searchResults.length > 0 ? (
                            searchResults.map((user) => {
                                const normalized = normalizeUser(user);
                                return (
                                    <div
                                        key={normalized.id}
                                        onMouseDown={() => startChatWithUser(user)}
                                        onClick={() => startChatWithUser(user)}
                                        className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-r-2 border-transparent active:bg-white/10"
                                    >
                                        <Avatar className="w-10 h-10 border border-border pointer-events-none">
                                            <AvatarImage src={getMediaUrl(normalized.avatar) || "https://github.com/shadcn.png"} />
                                            <AvatarFallback>{(normalized.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0 pointer-events-none">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-[15px] truncate">{normalized.name}</span>
                                                {normalized.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                                            </div>
                                            <span className="text-muted-foreground text-[14px]">@{normalized.handle}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center text-muted-foreground">
                                No users found
                            </div>
                        )
                    ) : (
                        /* Existing Conversations */
                        conversations.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-r-2",
                                selectedChat?.id === chat.id ? "bg-white/[0.03] border-blue-500" : "border-transparent"
                            )}
                        >
                            <Avatar className="w-10 h-10 border border-border">
                                <AvatarImage src={getMediaUrl(chat.user.avatar)} />
                                <AvatarFallback>{chat.user.name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-[15px] truncate">{chat.user.name}</span>
                                        {chat.user.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                                        <span className="text-muted-foreground text-[14px]">@{chat.user.handle}</span>
                                    </div>
                                    <span className="text-muted-foreground text-[13px]">{chat.timestamp}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className={cn("text-[14px] truncate", chat.unread ? "text-white font-bold" : "text-muted-foreground")}>
                                        {chat.lastMessage || t('chat.start_conversation')}
                                    </p>
                                    {chat.unread && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                            </div>
                        </div>
                    ))
                    )}
                </div>
            </div>

            {/* Right Panel: Chat Window */}
            <div className="flex-1 flex flex-col h-screen bg-black">
                {selectedChat ? (
                    <>
                        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md px-4 py-3 border-b border-border flex items-center justify-between">
                            <div className="flex flex-col">
                                <h2 className="text-lg font-bold">{selectedChat.user.name}</h2>
                                <span className="text-sm text-muted-foreground">@{selectedChat.user.handle}</span>
                            </div>
                            <Info className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {/* Profile Info in Chat */}
                            <div className="flex flex-col items-center justify-center py-8 hover:bg-white/[0.03] rounded-xl transition-colors mb-4 border-b border-border/50">
                                <Avatar className="w-16 h-16 mb-2">
                                    <AvatarImage src={getMediaUrl(selectedChat.user.avatar)} />
                                    <AvatarFallback>{selectedChat.user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-lg font-bold flex items-center gap-1">
                                    {selectedChat.user.name}
                                    {selectedChat.user.verified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />}
                                </h3>
                                <p className="text-muted-foreground">@{selectedChat.user.handle}</p>
                            </div>

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[70%]",
                                        msg.sender === "me" ? "self-end items-end" : "self-start items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "px-4 py-3 rounded-2xl text-[15px]",
                                            msg.sender === "me"
                                                ? "bg-[rgb(29,155,240)] text-white rounded-br-sm"
                                                : "bg-[#2f3336] text-white rounded-bl-sm"
                                        )}
                                    >
                                        {msg.mediaUrl && (
                                            msg.mediaType === 'video' ? (
                                                <div className="relative">
                                                    <video 
                                                        src={getMediaUrl(msg.mediaUrl)} 
                                                        controls 
                                                        poster={getMediaUrl(msg.thumbnailUrl)}
                                                        className="rounded-lg mb-2 max-h-[300px] w-full object-cover bg-black" 
                                                    />
                                                    {msg.duration && (
                                                        <span className="absolute bottom-4 right-2 bg-black/60 text-white text-xs px-1 rounded">
                                                            {new Date(msg.duration * 1000).toISOString().substr(14, 5)}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : msg.mediaType === 'audio' ? (
                                                <div className="w-[200px] bg-gray-900 rounded-lg p-2 mb-2">
                                                    <audio src={getMediaUrl(msg.mediaUrl)} controls className="w-full" />
                                                    {msg.duration && (
                                                         <div className="text-xs text-muted-foreground text-right mt-1">
                                                            {new Date(msg.duration * 1000).toISOString().substr(14, 5)}
                                                         </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <img
                                                    src={getMediaUrl(msg.mediaUrl)}
                                                    alt="Attachment"
                                                    className="rounded-lg mb-2 max-h-[300px] w-full object-cover"
                                                />
                                            )
                                        )}
                                        {msg.text}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground mt-1 px-1">
                                        {msg.timestamp} {msg.sender === "me" && `· ${t('chat.sent')}`}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t border-border bg-black relative">
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

                            <div className="bg-[#202327] rounded-2xl flex items-center px-2 py-1 focus-within:ring-1 focus-within:ring-blue-500">
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
                                    className="text-blue-500 hover:bg-blue-500/10 rounded-full h-8 w-8"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("rounded-full h-8 w-8", showEmojiPicker ? "text-blue-500 bg-blue-500/10" : "text-blue-500 hover:bg-blue-500/10")}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    <Smile className="w-5 h-5" />
                                </Button>
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isUploading ? t('feed.uploading') : t('chat.start_new_message')}
                                    className="flex-1 border-none bg-transparent focus-visible:ring-0 text-white placeholder:text-muted-foreground px-2 h-10"
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("rounded-full h-8 w-8 transition-colors", (newMessage.trim() || mediaAttachment) ? "text-blue-500 hover:bg-blue-500/10" : "text-muted-foreground opacity-50")}
                                    onClick={handleSendMessage}
                                    disabled={(!newMessage.trim() && !mediaAttachment) || isUploading}
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-center p-8">
                        <div className="max-w-[400px]">
                            <div className="w-16 h-16 mb-6 mx-auto relative">
                                <Mail className="w-16 h-16 text-white" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-[31px] font-bold mb-2">{t('chat.start_conversation')}</h2>
                            <p className="text-[15px] text-muted-foreground mb-7">{t('chat.choose_conversation')}</p>
                            <Button 
                                onClick={() => document.querySelector('input[placeholder="' + t('right_sidebar.search_placeholder') + '"]')?.focus()}
                                className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-[52px] text-[17px]"
                            >
                                {t('chat.new_chat')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
