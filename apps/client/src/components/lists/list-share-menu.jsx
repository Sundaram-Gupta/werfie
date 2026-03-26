import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { PenLine, Mail, Link2, Share, Share2, Search, Send, Check } from "lucide-react"
import { ComposeModal } from "@/components/feed/compose-modal"
import { messagingService, userService, searchService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { useAuthModal } from "@/components/auth/auth-modal-context"

function ShareListChatDialog({ isOpen, onClose, listUrl, listName }) {
    const { user: authUser } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [conversations, setConversations] = useState([])
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [sendingId, setSendingId] = useState(null)
    const [sentIds, setSentIds] = useState(() => new Set())

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("")
            setSentIds(new Set())
            return
        }
        if (authUser) loadConversations()
    }, [isOpen, authUser])

    const loadConversations = async () => {
        try {
            setLoading(true)
            const data = await messagingService.getConversations()
            const list = Array.isArray(data) ? data : []
            const currentUserId = authUser.id
            const otherUserIds = new Set()
            list.forEach((c) => {
                c.participants.forEach((p) => {
                    if (p.userId !== currentUserId) otherUserIds.add(p.userId)
                })
            })
            const users = await userService.getUsers(Array.from(otherUserIds))
            const userMap = {}
            users.forEach((u) => {
                userMap[u.id] = u
            })
            const enriched = list.map((c) => {
                const otherParticipant = c.participants.find((p) => p.userId !== currentUserId)
                const otherUser = userMap[otherParticipant?.userId]
                return {
                    id: c.id,
                    recipientId: otherParticipant?.userId,
                    user: otherUser
                        ? {
                              id: otherUser.id,
                              name: otherUser.profile?.name || otherUser.name || "Unknown",
                              handle: otherUser.profile?.handle || otherUser.handle || "unknown",
                              avatar: otherUser.profile?.avatar,
                          }
                        : { id: "unknown", name: "Unknown", handle: "unknown" },
                }
            })
            setConversations(enriched)
        } catch (e) {
            console.error("Failed to load conversations for list share", e)
            toast.error("Could not load chats")
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
                setSearchResults(
                    results.map((u) => ({
                        id: u.id,
                        name: u.profile?.name || u.name || "Unknown",
                        handle: u.profile?.handle || u.handle || "unknown",
                        avatar: u.profile?.avatar,
                    }))
                )
            } catch (e) {
                console.error("Search failed", e)
            }
        }
        const t = setTimeout(searchUsers, 300)
        return () => clearTimeout(t)
    }, [searchQuery])

    const handleSend = async (recipientId) => {
        if (!recipientId || sentIds.has(recipientId)) return
        const text = listName ? `${listName}\n${listUrl}` : listUrl
        try {
            setSendingId(recipientId)
            await messagingService.sendMessage(recipientId, text)
            setSentIds((prev) => new Set([...prev, recipientId]))
            toast.success("Sent")
        } catch (e) {
            console.error("Send list link failed", e)
            toast.error("Could not send message")
        } finally {
            setSendingId(null)
        }
    }

    const displayedUsers = searchQuery.trim() ? searchResults : conversations.map((c) => c.user)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] bg-black border-zinc-800 p-0 overflow-hidden text-white">
                <DialogHeader className="p-4 border-b border-zinc-800">
                    <DialogTitle>Send via Chat</DialogTitle>
                    <DialogDescription className="sr-only">Choose someone to send this list link to</DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search people"
                            className="w-full bg-zinc-900 border-none rounded-full pl-10 h-10 text-white placeholder:text-zinc-500"
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                        {loading && !displayedUsers.length ? (
                            <div className="py-8 text-center text-zinc-500">Loading…</div>
                        ) : displayedUsers.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {displayedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-2 hover:bg-white/[0.03] rounded-xl"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="w-10 h-10 border border-zinc-800 shrink-0">
                                                <AvatarImage src={getMediaUrl(user.avatar)} />
                                                <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[15px] truncate">{user.name}</span>
                                                <span className="text-zinc-500 text-[14px] truncate">@{user.handle}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleSend(user.id)}
                                            disabled={sendingId === user.id || sentIds.has(user.id)}
                                            className={`p-2 rounded-full shrink-0 ${
                                                sentIds.has(user.id)
                                                    ? "bg-green-500/10 text-green-500"
                                                    : "text-sky-500 hover:bg-sky-500/10"
                                            }`}
                                        >
                                            {sendingId === user.id ? (
                                                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent animate-spin rounded-full" />
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
                            <div className="py-8 text-center text-zinc-500">
                                {searchQuery ? "No people found" : "No recent chats"}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function ListShareMenu({ listId, listName, triggerClassName = "" }) {
    const { user } = useAuth()
    const { openLogin } = useAuthModal()
    const [composeOpen, setComposeOpen] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const listUrl = typeof window !== "undefined" ? `${window.location.origin}/lists/${listId}` : ""

    const requireUser = () => {
        if (!user) {
            openLogin()
            toast.message("Sign in to continue")
            return false
        }
        return true
    }

    const copyLink = async () => {
        if (!listUrl) return
        try {
            await navigator.clipboard.writeText(listUrl)
            toast.success("Copied to clipboard")
        } catch {
            toast.error("Could not copy link")
        }
    }

    const shareNative = async () => {
        if (!listUrl) return
        const title = listName || "List"
        if (navigator.share) {
            try {
                await navigator.share({ title, text: title, url: listUrl })
            } catch (e) {
                if (e?.name !== "AbortError") {
                    await copyLink()
                }
            }
        } else {
            await copyLink()
        }
    }

    const openPostComposer = () => {
        if (!requireUser()) return
        setComposeOpen(true)
    }

    const openChatShare = () => {
        if (!requireUser()) return
        setChatOpen(true)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label="Share list"
                        className={`p-2 hover:bg-zinc-900 rounded-full transition ${triggerClassName}`}
                    >
                        <Share className="w-5 h-5 text-white" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-[min(100vw-2rem,280px)] bg-black border-zinc-800 text-white p-1 rounded-xl shadow-2xl"
                >
                    <DropdownMenuItem
                        className="flex items-center gap-3 cursor-pointer rounded-lg py-3 px-3 focus:bg-zinc-900"
                        onSelect={openPostComposer}
                    >
                        <PenLine className="w-5 h-5 shrink-0" />
                        <span className="text-[15px] font-medium">Post this</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex items-center gap-3 cursor-pointer rounded-lg py-3 px-3 focus:bg-zinc-900"
                        onSelect={openChatShare}
                    >
                        <Mail className="w-5 h-5 shrink-0" />
                        <span className="text-[15px] font-medium">Send via Chat</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex items-center gap-3 cursor-pointer rounded-lg py-3 px-3 focus:bg-zinc-900"
                        onSelect={() => copyLink()}
                    >
                        <Link2 className="w-5 h-5 shrink-0" />
                        <span className="text-[15px] font-medium">Copy link to List</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="flex items-center gap-3 cursor-pointer rounded-lg py-3 px-3 focus:bg-zinc-900"
                        onSelect={() => shareNative()}
                    >
                        <Share2 className="w-5 h-5 shrink-0" />
                        <span className="text-[15px] font-medium">Share List</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} initialContent={listUrl} />

            <ShareListChatDialog
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                listUrl={listUrl}
                listName={listName}
            />
        </>
    )
}
