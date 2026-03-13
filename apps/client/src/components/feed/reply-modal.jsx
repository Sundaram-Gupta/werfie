import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Image, X, MapPin, Smile, FileBarChart2, CalendarClock } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { postService } from "@/services/api"

export function ReplyModal({ post, children }) {
    const [replyText, setReplyText] = useState("")
    const [open, setOpen] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const textareaRef = useRef(null)

    const MAX_CHARS = 280
    const progress = (replyText.length / MAX_CHARS) * 100
    const isOverLimit = replyText.length > MAX_CHARS
    const isEmpty = replyText.trim().length === 0

    // Handle backend data structure
    const user = {
        name: post.user?.profile?.name || post.user?.name || 'Unknown User',
        handle: post.user?.profile?.handle || post.user?.handle || 'unknown',
        avatar: post.user?.profile?.avatar || post.user?.avatar || '/websplash.png',
    }

    // Format timestamp
    const getRelativeTime = (dateString) => {
        if (!dateString) return 'now'
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now - date) / 1000)

        if (seconds < 60) return `${seconds}s`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}m`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h`
        const days = Math.floor(hours / 24)
        return `${days}d`
    }

    const timestamp = getRelativeTime(post.createdAt || post.timestamp)

    const adjustHeight = () => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = `${textarea.scrollHeight}px`
        }
    }

    useEffect(() => {
        adjustHeight()
    }, [replyText])

    const handleReply = async () => {
        if (isEmpty || isOverLimit || isPosting) return

        setIsPosting(true)
        try {
            await postService.createReply(post.id, replyText.trim())
            setReplyText("")
            setOpen(false)
            window.dispatchEvent(new Event('feed-refresh'))
        } catch (error) {
            console.error('Error posting reply:', error)
            alert('Failed to post reply. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-black border-[rgb(47,51,54)] p-0 gap-0 top-[20%] translate-y-0 sm:top-[5%] sm:translate-y-0 text-white">
                <DialogTitle className="sr-only">Reply to post</DialogTitle>
                <DialogDescription className="sr-only">Compose a reply to this post</DialogDescription>
                <DialogHeader className="px-4 py-3 flex flex-row items-center justify-between border-b border-transparent">
                    <button className="rounded-full p-2 hover:bg-[rgb(239,243,244,0.1)] transition-colors w-fit h-fit -ml-2" onClick={() => setOpen(false)}>
                        <X className="w-5 h-5" />
                    </button>
                    <span className="text-blue-500 font-bold text-[14px] cursor-pointer hover:bg-blue-500/10 px-3 py-1 rounded-full transition-colors mr-10">
                        Drafts
                    </span>
                </DialogHeader>

                <div className="px-4 pt-2 pb-4">
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <Avatar className="w-10 h-10 border border-black z-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="w-[2px] bg-[rgb(51,54,57)] flex-1 my-2 min-h-12" />
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex gap-1 text-[15px]">
                                <span className="font-bold">{user.name}</span>
                                <span className="text-[rgb(113,118,123)]">@{user.handle} · {timestamp}</span>
                            </div>
                            <div className="text-[15px] mt-0.5 leading-5 text-white">{post.content}</div>
                            <div className="text-[rgb(113,118,123)] text-[15px] mt-4">
                                Replying to <span className="text-blue-500">@{user.handle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-1">
                        <Avatar className="w-10 h-10">
                            {/* In a real app, this would be the current user's avatar */}
                            <AvatarFallback className="bg-slate-700">ME</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent border-none outline-none text-[20px] placeholder-[rgb(113,118,123)] resize-none min-h-[120px] text-white"
                                placeholder="Post your reply"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />

                            <div className="flex items-center justify-between mt-4 border-t border-[rgb(47,51,54)] pt-3">
                                <div className="flex gap-1 text-blue-500 -ml-2">
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><Image className="w-5 h-5" /></button>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><FileBarChart2 className="w-5 h-5" /></button>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><Smile className="w-5 h-5" /></button>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><CalendarClock className="w-5 h-5" /></button>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><MapPin className="w-5 h-5 opacity-50" /></button>
                                </div>

                                <div className="flex items-center gap-4">
                                    {replyText.length > 0 && (
                                        <div className="relative w-5 h-5 flex items-center justify-center">
                                            <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(47,51,54)" strokeWidth="8" />
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke={isOverLimit ? "rgb(244,33,46)" : progress > 90 ? "rgb(255,212,0)" : "rgb(29,155,240)"}
                                                    strokeWidth="8"
                                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - Math.min(progress, 100) / 100)}`}
                                                    className="transition-all duration-300"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    <Button
                                        disabled={isEmpty || isOverLimit || isPosting}
                                        className="bg-[rgb(29,155,240)] hover:bg-[rgb(26,140,216)] text-white font-bold rounded-full px-4 py-1.5 h-auto text-[15px] disabled:opacity-50 disabled:bg-[rgb(29,155,240)]"
                                        onClick={handleReply}
                                    >
                                        {isPosting ? 'Replying...' : 'Reply'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
