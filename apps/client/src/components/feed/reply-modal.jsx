import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Image, X, MapPin, Smile, FileBarChart2 as BarChart2, CalendarClock, Calendar } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { postService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { usePosts } from "@/hooks/usePosts"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import EmojiPicker from 'emoji-picker-react'
import { Link } from "react-router-dom"
import { cn, getMediaUrl } from "@/lib/utils"

export function ReplyModal({ post, children }) {
    const { t } = useTranslation()
    const { user: currentUser } = useAuth()
    const { createPost: createPostHook } = usePosts()
    const [replyText, setReplyText] = useState("")
    const [open, setOpen] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [filePreviews, setFilePreviews] = useState([])
    const [showPollModal, setShowPollModal] = useState(false)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [showLocationInput, setShowLocationInput] = useState(false)
    const [location, setLocation] = useState("")
    const [pollQuestion, setPollQuestion] = useState("")
    const [pollOptions, setPollOptions] = useState(["", ""])
    const [scheduledMonth, setScheduledMonth] = useState("")
    const [scheduledDay, setScheduledDay] = useState("")
    const [scheduledYear, setScheduledYear] = useState("")
    const [scheduledHour, setScheduledHour] = useState("12")
    const [scheduledMinute, setScheduledMinute] = useState("00")
    const [scheduledAmPm, setScheduledAmPm] = useState("PM")
    
    const textareaRef = useRef(null)
    const fileInputRef = useRef(null)
    const locationInputRef = useRef(null)

    const isPollContent = /poll/i.test(replyText)
    const MAX_CHARS = isPollContent ? 500 : 280
    const progress = (replyText.length / MAX_CHARS) * 100
    const isOverLimit = replyText.length > MAX_CHARS
    const isEmpty = replyText.trim().length === 0 && selectedFiles.length === 0 && !location.trim()

    // Handle backend data structure
    const author = {
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

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (isPollContent) {
            setReplyText("")
            toast.info("Media replaces poll. Poll removed.")
        }

        const newFiles = []
        const newPreviews = []
        for (const file of files) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Max 10MB.`)
                continue
            }
            if (selectedFiles.length + newFiles.length >= 4) break
            newFiles.push(file)
            const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'other'
            newPreviews.push({ url: URL.createObjectURL(file), type })
        }
        setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 4))
        setFilePreviews(prev => [...prev, ...newPreviews].slice(0, 4))
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeMedia = (index) => {
        URL.revokeObjectURL(filePreviews[index]?.url)
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setFilePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const onEmojiClick = (emojiObject) => {
        setReplyText(prev => prev + emojiObject.emoji);
    }

    const handleOpenPollModal = () => {
        if (selectedFiles.length > 0) {
            toast.error("Remove media to add a poll. Polls and media can't be combined.")
            return
        }
        setShowPollModal(true)
    }

    const handleAddPoll = () => {
        const question = pollQuestion.trim()
        const opts = pollOptions.filter(o => o.trim())
        if (!question || opts.length < 2) {
            toast.error("Add a question and at least 2 options")
            return
        }
        if (selectedFiles.length > 0) {
            filePreviews.forEach(p => URL.revokeObjectURL(p.url))
            setSelectedFiles([])
            setFilePreviews([])
        }
        const pollText = `📊 Poll: ${question}\n${opts.map((o, i) => `${i + 1}. ${o.trim()}`).join("\n")}`
        setReplyText(prev => (prev ? `${prev}\n\n${pollText}` : pollText))
        setShowPollModal(false)
        setPollQuestion("")
        setPollOptions(["", ""])
        toast.success("Poll added. Click Reply to publish.")
    }

    const addPollOption = () => {
        if (pollOptions.length < 4) setPollOptions([...pollOptions, ""])
    }

    const removePollOption = (idx) => {
        if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx))
    }

    const getScheduleDateTime = () => {
        const now = new Date()
        const m = scheduledMonth || String(now.getMonth() + 1)
        const d = scheduledDay || String(now.getDate())
        const y = scheduledYear || String(now.getFullYear())
        let h = parseInt(scheduledHour || "12", 10)
        if (scheduledAmPm === "PM" && h !== 12) h += 12
        if (scheduledAmPm === "AM" && h === 12) h = 0
        const min = scheduledMinute || "00"
        return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${String(h).padStart(2, "0")}:${min}:00`)
    }

    const getScheduleSummary = () => {
        const dt = getScheduleDateTime()
        return dt.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
    }

    const getTimezoneName = () => {
        try {
            return new Intl.DateTimeFormat("en-US", { timeZoneName: "long" })
                .formatToParts(new Date())
                .find((p) => p.type === "timeZoneName")?.value || Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
            return Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    }

    useEffect(() => {
        if (showScheduleModal) {
            const t = new Date()
            t.setDate(t.getDate() + 1)
            setScheduledMonth(String(t.getMonth() + 1))
            setScheduledDay(String(t.getDate()))
            setScheduledYear(String(t.getFullYear()))
            const h = t.getHours()
            setScheduledHour(String(h % 12 || 12))
            setScheduledMinute(String(t.getMinutes()).padStart(2, "0"))
            setScheduledAmPm(h >= 12 ? "PM" : "AM")
        }
    }, [showScheduleModal])

    const handleLocationSubmit = (e) => {
        e?.preventDefault()
        const val = locationInputRef.current?.value?.trim()
        if (val) {
            setLocation(val)
            setShowLocationInput(false)
            if (locationInputRef.current) locationInputRef.current.value = ''
            toast.success(`Location set: ${val}`)
        }
    }

    const handleReply = async () => {
        let finalContent = replyText.trim()
        if (location.trim()) {
            finalContent = finalContent ? `${finalContent}\n\n📍 ${location.trim()}` : `📍 ${location.trim()}`
        }
        if ((!finalContent && selectedFiles.length === 0) || isOverLimit || isPosting) return

        setIsPosting(true)
        try {
            // Using createPostHook from usePosts for consistency and state management
            await createPostHook(finalContent, selectedFiles, post.id)
            
            filePreviews.forEach(p => URL.revokeObjectURL(p.url))
            setReplyText("")
            setSelectedFiles([])
            setFilePreviews([])
            setLocation("")
            setOpen(false)
            toast.success(t('feed.posted') || 'Reply posted!')
            window.dispatchEvent(new Event('feed-refresh'))
        } catch (error) {
            console.error('Error posting reply:', error)
            toast.error('Failed to post reply. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    const handleScheduleConfirm = async () => {
        let finalContent = replyText.trim()
        if (location.trim()) {
            finalContent = finalContent ? `${finalContent}\n\n📍 ${location.trim()}` : `📍 ${location.trim()}`
        }
        if (!finalContent && selectedFiles.length === 0) {
            toast.error("Add content or media to schedule")
            return
        }
        const dt = getScheduleDateTime()
        if (dt <= new Date()) {
            toast.error("Schedule time must be in the future")
            return
        }
        setIsPosting(true)
        try {
            await postService.createPost(finalContent, selectedFiles, post.id, dt)
            filePreviews.forEach(p => URL.revokeObjectURL(p.url))
            setReplyText("")
            setSelectedFiles([])
            setFilePreviews([])
            setLocation("")
            setShowScheduleModal(false)
            setOpen(false)
            window.dispatchEvent(new Event('feed-refresh'))
            toast.success(t("feed.scheduled") || `Reply scheduled for ${dt.toLocaleString()}`)
        } catch (error) {
            console.error("Schedule reply error:", error)
            toast.error("Failed to schedule reply")
        } finally {
            setIsPosting(false)
        }
    }

    const userName = currentUser?.profile?.name || currentUser?.name || 'Me'
    const userAvatar = currentUser?.profile?.avatar || currentUser?.avatar || null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-black border-[rgb(47,51,54)] p-0 gap-0 top-[20%] translate-y-0 sm:top-[5%] sm:translate-y-0 text-white overflow-visible">
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
                                <AvatarImage src={author.avatar} />
                                <AvatarFallback>{author.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="w-[2px] bg-[rgb(51,54,57)] flex-1 my-2 min-h-12" />
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex gap-1 text-[15px]">
                                <span className="font-bold">{author.name}</span>
                                <span className="text-[rgb(113,118,123)]">@{author.handle} · {timestamp}</span>
                            </div>
                            <div className="text-[15px] mt-0.5 leading-5 text-white line-clamp-4">{post.content}</div>
                            <div className="text-[rgb(113,118,123)] text-[15px] mt-4">
                                Replying to <span className="text-blue-500">@{author.handle}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-1">
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={getMediaUrl(userAvatar)} />
                            <AvatarFallback className="bg-slate-700">{userName[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent border-none outline-none text-[20px] placeholder-[rgb(113,118,123)] resize-none min-h-[120px] text-white"
                                placeholder="Post your reply"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />

                            {/* Media Previews */}
                            {filePreviews.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                    {filePreviews.map((preview, index) => (
                                        <div key={index} className="relative shrink-0">
                                            {preview.type === 'image' ? (
                                                <img src={preview.url} alt="Preview" className="h-24 w-auto rounded-xl object-cover border border-[rgb(47,51,54)]" />
                                            ) : preview.type === 'video' ? (
                                                <video src={preview.url} className="h-24 w-auto rounded-xl object-cover border border-[rgb(47,51,54)]" muted playsInline />
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(index)}
                                                className="absolute -top-1 -right-1 bg-black/70 rounded-full p-0.5 text-white hover:bg-black/90"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Location Display */}
                            {location && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-[rgb(113,118,123)] flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {location}
                                    </span>
                                    <button type="button" onClick={() => setLocation("")} className="text-[rgb(113,118,123)] hover:text-white p-0.5">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-4 border-t border-[rgb(47,51,54)] pt-3 relative">
                                <div className="flex gap-1 text-blue-500 -ml-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleFileSelect}
                                    />
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-blue-500/10 rounded-full transition-colors" title="Media"><Image className="w-5 h-5" /></button>
                                    <button onClick={handleOpenPollModal} className="p-2 hover:bg-blue-500/10 rounded-full transition-colors" title="Poll"><BarChart2 className="w-5 h-5" /></button>
                                    
                                    <div className="relative">
                                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-blue-500/10 rounded-full transition-colors" title="Emoji"><Smile className="w-5 h-5" /></button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 z-[60] mb-2 shadow-2xl rounded-xl">
                                                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)}></div>
                                                <div className="relative z-50">
                                                    <EmojiPicker
                                                        onEmojiClick={onEmojiClick}
                                                        theme="dark"
                                                        width={300}
                                                        height={400}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={() => setShowScheduleModal(true)} className="p-2 hover:bg-blue-500/10 rounded-full transition-colors" title="Schedule"><CalendarClock className="w-5 h-5" /></button>
                                    
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowLocationInput(!showLocationInput)} 
                                            className={cn("p-2 hover:bg-blue-500/10 rounded-full transition-colors", location && "text-blue-500")} 
                                            title="Location"
                                        >
                                            <MapPin className="w-5 h-5" />
                                        </button>
                                        {showLocationInput && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowLocationInput(false)} aria-hidden="true" />
                                                <div className="absolute left-0 bottom-full mb-2 z-50 flex gap-2 p-2 bg-black border border-[rgb(47,51,54)] rounded-xl shadow-lg">
                                                    <Input
                                                        ref={locationInputRef}
                                                        placeholder="e.g. New York"
                                                        className="w-40 h-9 bg-transparent border-[rgb(47,51,54)] text-white"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit(e)}
                                                    />
                                                    <Button size="sm" onClick={handleLocationSubmit} className="bg-blue-500 hover:bg-blue-600">
                                                        Add
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
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

                {/* Sub-modals for Poll and Schedule */}
                <Dialog open={showPollModal} onOpenChange={setShowPollModal}>
                    <DialogContent className="sm:max-w-md bg-black border-[rgb(47,51,54)] text-white">
                        <DialogHeader>
                            <DialogTitle>Add poll</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div>
                                <label className="text-sm font-medium block mb-2">Question</label>
                                <Input
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    placeholder="What's your poll about?"
                                    className="bg-transparent border-[rgb(47,51,54)]"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">Options</label>
                                {pollOptions.map((opt, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <Input
                                            value={opt}
                                            onChange={(e) => setPollOptions(pollOptions.map((o, j) => j === i ? e.target.value : o))}
                                            placeholder={`Option ${i + 1}`}
                                            className="bg-transparent border-[rgb(47,51,54)] flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePollOption(i)}
                                            disabled={pollOptions.length <= 2}
                                            className="hover:bg-red-500/10 text-red-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                {pollOptions.length < 4 && (
                                    <Button type="button" variant="outline" size="sm" onClick={addPollOption} className="border-[rgb(47,51,54)] hover:bg-white/5">
                                        + Add option
                                    </Button>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setShowPollModal(false)}>Cancel</Button>
                            <Button onClick={handleAddPoll} className="bg-blue-500 hover:bg-blue-600">Add poll</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                    <DialogContent className="sm:max-w-md bg-black border-[rgb(47,51,54)] text-white p-0 gap-0">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(47,51,54)]">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors -ml-2">
                                    <X className="w-5 h-5" />
                                </button>
                                <DialogTitle className="text-lg font-semibold m-0">Schedule</DialogTitle>
                            </div>
                            <Button onClick={handleScheduleConfirm} className="rounded-full bg-white text-black hover:bg-white/90 font-semibold px-4 h-8">
                                Confirm
                            </Button>
                        </div>
                        <div className="px-4 py-4 space-y-5">
                            <div className="flex items-center gap-2 text-sm text-[rgb(113,118,123)]">
                                <Calendar className="w-4 h-4" />
                                <span>Will send on {getScheduleSummary()}</span>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">Date</label>
                                <div className="flex gap-2">
                                    <Select value={scheduledMonth} onValueChange={setScheduledMonth}>
                                        <SelectTrigger className="bg-black border-[rgb(47,51,54)] flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-black border-[rgb(47,51,54)] text-white">
                                            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                                                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={scheduledDay} onValueChange={setScheduledDay}>
                                        <SelectTrigger className="bg-black border-[rgb(47,51,54)] flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-black border-[rgb(47,51,54)] text-white">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={scheduledYear} onValueChange={setScheduledYear}>
                                        <SelectTrigger className="bg-black border-[rgb(47,51,54)] flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-black border-[rgb(47,51,54)] text-white">
                                            {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">Time</label>
                                <div className="flex gap-2">
                                    <Select value={scheduledHour} onValueChange={setScheduledHour}>
                                        <SelectTrigger className="bg-black border-[rgb(47,51,54)] flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-black border-[rgb(47,51,54)] text-white">
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                                <SelectItem key={h} value={String(h)}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={scheduledMinute} onValueChange={setScheduledMinute}>
                                        <SelectTrigger className="bg-black border-[rgb(47,51,54)] flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-black border-[rgb(47,51,54)] text-white">
                                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={scheduledAmPm} onValueChange={setScheduledAmPm}>
                                        <SelectTrigger className="bg-black border-[rgb(47,51,54)] flex-1"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-black border-[rgb(47,51,54)] text-white">
                                            <SelectItem value="AM">AM</SelectItem>
                                            <SelectItem value="PM">PM</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    )
}
