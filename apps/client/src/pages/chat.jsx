import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Mail, Search, Settings, Image as ImageIcon, Smile, Send, Info, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn, getMediaUrl } from "@/lib/utils"
import EmojiPicker from 'emoji-picker-react'
import { mediaService, searchService, messagingService, userService, authService } from "@/services/api"
import { socketService } from "@/services/socket"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function Chat() {
    const { t } = useTranslation()
    const location = useLocation()
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [conversations, setConversations] = useState([])
    const [selectedChat, setSelectedChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // New State for Media/Emoji
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [mediaAttachment, setMediaAttachment] = useState(null) // { url, type }
    const fileInputRef = useRef(null)
    const [searchResults, setSearchResults] = useState([])
    const [typingUsers, setTypingUsers] = useState({}) // { conversationId: [userIds] }

    // Initialize Socket & Load Data
    useEffect(() => {
        const init = async () => {
            const user = authService.getStoredUser()
            if (!user) return
            setCurrentUser(user)

            // Connect Socket
            const socket = socketService.connect()
            
            if (socket) {
                // Listen for messages
                socket.on('receive_message', handleReceiveMessage)
                socket.on('typing_start', handleTypingStart)
                socket.on('typing_stop', handleTypingStop)
            }

            await loadConversations(user.id)
        }

        init()

        return () => {
            const socket = socketService.getSocket()
            if (socket) {
                socket.off('receive_message')
                socket.off('typing_start')
                socket.off('typing_stop')
            }
            socketService.disconnect()
        }
    }, [])

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
            users.forEach(u => userMap[u.id] = u)

            const enriched = data.map(c => {
                const otherParticipant = c.participants.find(p => p.userId !== currentUserId)
                const otherUser = userMap[otherParticipant?.userId] || { name: 'Unknown', handle: 'unknown' }
                
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

    const handleReceiveMessage = (message) => {
        // message has conversationId
        // Update messages if selected chat
        setSelectedChat(prev => {
            if (prev && prev.id === message.conversationId) {
                setMessages(msgs => [...msgs, formatMessage(message)])
            }
            return prev
        })

        // Update conversation list
        setConversations(prev => {
            const existing = prev.find(c => c.id === message.conversationId)
            if (existing) {
                return prev.map(c => 
                    c.id === message.conversationId 
                        ? { 
                            ...c, 
                            lastMessage: message.content || "Attachment", 
                            timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            unread: selectedChat?.id !== message.conversationId 
                        } 
                        : c
                ) // Move to top would be better, but map is stable
            } else {
                // New conversation incoming? 
                // We'd need to fetch details or just reload. Reload simpler for now.
                // loadConversations(currentUser.id) 
                return prev 
            }
        })
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


    const formatMessage = (msg) => ({
        id: msg.id,
        sender: msg.senderId === currentUser?.id ? "me" : "them",
        text: msg.content,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.type,
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
        if (!currentUser) return

        try {
            // Optimistic UI update or find existing in list
            const recipientId = user._id || user.id
            const existing = conversations.find(c => c.user.id === recipientId)
            
            if (existing) {
                setSelectedChat(existing)
            } else {
                // Create on backend
                const newConv = await messagingService.createConversation(recipientId)
                
                // Formatted structure
                const chatObj = {
                    id: newConv.id,
                    user: user,
                    lastMessage: "",
                    timestamp: "New",
                    unread: false
                }
                
                setConversations([chatObj, ...conversations])
                setSelectedChat(chatObj)
            }
            
            setSearchQuery("")
            setSearchResults([])
        } catch (error) {
            console.error("Failed to start chat", error)
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
        try {
            const { url } = await mediaService.uploadMedia(file)
            setMediaAttachment({
                url,
                type: file.type.startsWith('video/') ? 'video' : 'image'
            })
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSendMessage = () => {
        if ((!newMessage.trim() && !mediaAttachment) || !selectedChat) return

        const payload = {
            conversationId: selectedChat.id,
            content: newMessage,
            type: mediaAttachment ? mediaAttachment.type : 'text',
            mediaUrl: mediaAttachment?.url
        }

        // Optimistic update
        const tempMsg = {
           id: Date.now(),
           senderId: currentUser.id,
           content: newMessage,
           type: payload.type,
           mediaUrl: payload.mediaUrl,
           createdAt: new Date()
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
                            searchResults.map((user) => (
                                <div
                                    key={user._id || user.id}
                                    onClick={() => startChatWithUser(user)}
                                    className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-r-2 border-transparent"
                                >
                                    <Avatar className="w-10 h-10 border border-border">
                                        <AvatarImage src={user.avatar || user.profile?.avatar || "https://github.com/shadcn.png"} />
                                        <AvatarFallback>{(user.name?.[0] || 'U').toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-[15px] truncate">{user.name || user.profile?.name}</span>
                                            {user.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                                        </div>
                                        <span className="text-muted-foreground text-[14px]">@{user.handle || user.username || user.profile?.handle}</span>
                                    </div>
                                </div>
                            ))
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
                                <AvatarImage src={chat.user.avatar || "https://github.com/shadcn.png"} />
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
                                    <AvatarImage src={selectedChat.user.avatar || "https://github.com/shadcn.png"} />
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
                                                <video src={getMediaUrl(msg.mediaUrl)} controls className="rounded-lg mb-2 max-h-[300px] w-full object-cover" />
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
                                    accept="image/*,video/*"
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
                            <Button className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-[52px] text-[17px]">
                                {t('chat.new_chat')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
