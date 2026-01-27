import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BadgeCheck, Mail, Search, Settings, Image as ImageIcon, Smile, Send, Info, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn, getMediaUrl } from "@/lib/utils"
import EmojiPicker from 'emoji-picker-react'
import { mediaService } from "@/services/api"
import { useLocation } from "react-router-dom"

const CONVERSATIONS = [
    { id: 1, user: { name: "Elon Musk", handle: "elonmusk", avatar: "https://github.com/shadcn.png", verified: true }, lastMessage: "Let's build a rocket! 🚀", timestamp: "2m", unread: true },
    { id: 2, user: { name: "Vercel", handle: "vercel", avatar: "https://github.com/vercel.png", verified: true }, lastMessage: "Your deployment is ready.", timestamp: "1h", unread: false },
    { id: 3, user: { name: "Guillermo Rauch", handle: "rauchg", avatar: "https://github.com/rauchg.png", verified: true }, lastMessage: "Next.js 15 is insane.", timestamp: "3h", unread: false },
    { id: 4, user: { name: "React", handle: "reactjs", avatar: "https://github.com/reactjs.png", verified: true }, lastMessage: "Have you tried Server Components?", timestamp: "1d", unread: false },
    { id: 5, user: { name: "Tailwind CSS", handle: "tailwindcss", avatar: "https://github.com/tailwindlabs.png", verified: true }, lastMessage: "v4.0 is coming soon!", timestamp: "2d", unread: true },
    { id: 6, user: { name: "Linear", handle: "linear", avatar: "https://github.com/linear.png", verified: true }, lastMessage: "New issue tracking features.", timestamp: "3d", unread: false },
    { id: 7, user: { name: "OpenAI", handle: "openai", avatar: "https://github.com/openai.png", verified: true }, lastMessage: "GPT-5 preview?", timestamp: "1w", unread: false },
    { id: 8, user: { name: "GitHub", handle: "github", avatar: "https://github.com/github.png", verified: true }, lastMessage: "Copilot X is now available.", timestamp: "1w", unread: false },
]

const MESSAGES = [
    { id: 1, sender: "them", text: "Hey! How's the new X clone coming along?", timestamp: "10:30 AM" },
    { id: 2, sender: "me", text: "It's going great! Just implementing the chat feature now.", timestamp: "10:32 AM" },
    { id: 3, sender: "them", text: "Nice! Are you using Shadcn UI?", timestamp: "10:33 AM" },
    { id: 4, sender: "me", text: "Of course! It looks super clean. 🎨", timestamp: "10:34 AM" },
    { id: 5, sender: "them", text: "Can't wait to see it live! 🚀", timestamp: "10:35 AM" },
    { id: 6, sender: "me", text: "Sending you a preview link shortly.", timestamp: "10:36 AM" },
]


export default function Chat() {
    const location = useLocation()
    const [activeTab, setActiveTab] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedChat, setSelectedChat] = useState(CONVERSATIONS[0])
    const [messages, setMessages] = useState(MESSAGES)
    const [newMessage, setNewMessage] = useState("")

    // New State for Media/Emoji
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [mediaAttachment, setMediaAttachment] = useState(null) // { url, type }
    const fileInputRef = useRef(null)

    // Handle navigation from profile page
    useEffect(() => {
        if (location.state?.userId) {
            const { userId, userName, userHandle } = location.state

            // Check if conversation already exists
            const existingConversation = CONVERSATIONS.find(
                conv => conv.user.handle === userHandle
            )

            if (existingConversation) {
                // Select existing conversation
                setSelectedChat(existingConversation)
            } else {
                // Create new conversation entry
                const newConversation = {
                    id: CONVERSATIONS.length + 1,
                    user: {
                        name: userName,
                        handle: userHandle,
                        avatar: "https://github.com/shadcn.png",
                        verified: false
                    },
                    lastMessage: "Start a conversation...",
                    timestamp: "now",
                    unread: false
                }

                // Add to conversations list and select it
                CONVERSATIONS.unshift(newConversation)
                setSelectedChat(newConversation)
                setMessages([]) // Clear messages for new conversation
            }

            // Clear the navigation state
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

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
                type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
            })
        } catch (error) {
            console.error("Upload failed", error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSendMessage = () => {
        if (!newMessage.trim() && !mediaAttachment) return

        setMessages([...messages, {
            id: messages.length + 1,
            sender: "me",
            text: newMessage,
            mediaUrl: mediaAttachment?.url,
            mediaType: mediaAttachment?.type,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])

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
                        <h1 className="text-xl font-bold">Chat</h1>
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
                                placeholder="Search"
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
                            All
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
                            Requests
                            {activeTab === "requests" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex flex-col">
                    {CONVERSATIONS.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-r-2",
                                selectedChat.id === chat.id ? "bg-white/[0.03] border-blue-500" : "border-transparent"
                            )}
                        >
                            <Avatar className="w-10 h-10 border border-border">
                                <AvatarImage src={chat.user.avatar} />
                                <AvatarFallback>{chat.user.name[0]}</AvatarFallback>
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
                                        {chat.lastMessage}
                                    </p>
                                    {chat.unread && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                </div>
                            </div>
                        </div>
                    ))}
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
                                    <AvatarImage src={selectedChat.user.avatar} />
                                    <AvatarFallback>{selectedChat.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-lg font-bold flex items-center gap-1">
                                    {selectedChat.user.name}
                                    {selectedChat.user.verified && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />}
                                </h3>
                                <p className="text-muted-foreground">@{selectedChat.user.handle}</p>
                                <p className="text-muted-foreground text-sm mt-2">Joined September 2024 · 1.2M Followers</p>
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
                                            <img
                                                src={getMediaUrl(msg.mediaUrl)}
                                                alt="Attachment"
                                                className="rounded-lg mb-2 max-h-[300px] w-full object-cover"
                                            />
                                        )}
                                        {msg.text}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground mt-1 px-1">
                                        {msg.timestamp} {msg.sender === "me" && "· Sent"}
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
                                        <img src={getMediaUrl(mediaAttachment.url)} className="h-20 w-20 object-cover rounded-lg border border-border" />
                                        <button
                                            onClick={() => setMediaAttachment(null)}
                                            className="absolute -top-2 -right-2 bg-zinc-800 rounded-full p-1 border border-border hover:bg-zinc-700"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="text-sm text-muted-foreground">Attached Image</div>
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
                                    placeholder={isUploading ? "Uploading..." : "Start a new message"}
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
                            <h2 className="text-[31px] font-bold mb-2">Start Conversation</h2>
                            <p className="text-[15px] text-muted-foreground mb-7">Choose from your existing conversations, or start a new one.</p>
                            <Button className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 h-[52px] text-[17px]">
                                New chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
