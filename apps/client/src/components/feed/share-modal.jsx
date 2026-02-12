import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, Send, Check } from "lucide-react"
import { messagingService, userService, searchService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"

export function ShareModal({ isOpen, onClose, postUrl }) {
    const { user: authUser } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [conversations, setConversations] = useState([])
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [sendingId, setSendingId] = useState(null)
    const [sentIds, setSentIds] = useState(new Set())

    useEffect(() => {
        if (isOpen && authUser) {
            loadConversations()
        }
    }, [isOpen, authUser])

    const loadConversations = async () => {
        try {
            setLoading(true)
            const data = await messagingService.getConversations()
            
            // Enrich with user data (simplified from Chat.jsx)
            const currentUserId = authUser.id
            const otherUserIds = new Set()
            data.forEach(c => {
                c.participants.forEach(p => {
                    if (p.userId !== currentUserId) otherUserIds.add(p.userId)
                })
            })

            const users = await userService.getUsers(Array.from(otherUserIds))
            const userMap = {}
            users.forEach(u => {
                userMap[u.id] = u
            })

            const enriched = data.map(c => {
                const otherParticipant = c.participants.find(p => p.userId !== currentUserId)
                const otherUser = userMap[otherParticipant?.userId]
                return {
                    id: c.id,
                    recipientId: otherParticipant?.userId,
                    user: otherUser ? {
                        id: otherUser.id,
                        name: otherUser.profile?.name || otherUser.name || "Unknown",
                        handle: otherUser.profile?.handle || otherUser.handle || "unknown",
                        avatar: otherUser.profile?.avatar
                    } : { id: 'unknown', name: 'Unknown', handle: 'unknown' }
                }
            })
            setConversations(enriched)
        } catch (error) {
            console.error("Failed to load conversations for sharing", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([])
                return
            }
            try {
                const results = await searchService.searchUsers(searchQuery)
                setSearchResults(results.map(u => ({
                    id: u.id,
                    name: u.profile?.name || u.name || "Unknown",
                    handle: u.profile?.handle || u.handle || "unknown",
                    avatar: u.profile?.avatar
                })))
            } catch (error) {
                console.error("Search failed", error)
            }
        }

        const debounceTimer = setTimeout(searchUsers, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    const handleShare = async (recipientId) => {
        if (!recipientId || sentIds.has(recipientId)) return
        
        try {
            setSendingId(recipientId)
            // Use REST fallback for sharing as we don't necessarily have a socket here
            await messagingService.sendMessage(recipientId, postUrl)
            
            setSentIds(prev => new Set([...prev, recipientId]))
            toast.success("Shared successfully")
        } catch (error) {
            console.error("Failed to share via chat", error)
            toast.error("Failed to share")
        } finally {
            setSendingId(null)
        }
    }

    const displayedUsers = searchQuery.trim() ? searchResults : conversations.map(c => c.user)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-black border-border p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle>Share Post</DialogTitle>
                </DialogHeader>
                
                <div className="p-4 bg-black">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search people"
                            className="w-full bg-[#202327] border-none rounded-full pl-10 h-10 text-white placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                        {loading && !displayedUsers.length ? (
                            <div className="py-8 text-center text-muted-foreground">Loading...</div>
                        ) : displayedUsers.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {displayedUsers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-white/[0.03] rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border border-border">
                                                <AvatarImage src={getMediaUrl(user.avatar)} />
                                                <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[15px]">{user.name}</span>
                                                <span className="text-muted-foreground text-[14px]">@{user.handle}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleShare(user.id)}
                                            disabled={sendingId === user.id || sentIds.has(user.id)}
                                            className={`p-2 rounded-full transition-colors ${
                                                sentIds.has(user.id) 
                                                ? "bg-green-500/10 text-green-500 cursor-default" 
                                                : "text-blue-500 hover:bg-blue-500/10"
                                            }`}
                                        >
                                            {sendingId === user.id ? (
                                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent animate-spin rounded-full" />
                                            ) : sentIds.has(user.id) ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                {searchQuery ? "No people found" : "No recent conversations"}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
