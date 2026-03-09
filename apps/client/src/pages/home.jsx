import { Feed } from "@/components/feed/feed"
import { Image, AlignLeft, CalendarClock, Smile, MapPin, X } from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { postService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

import EmojiPicker from 'emoji-picker-react';
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export default function Home() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState("for-you")
    const [postContent, setPostContent] = useState("")
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
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")
    const fileInputRef = useRef(null)
    const locationInputRef = useRef(null)
    const { user } = useAuth()

    const handleCreatePost = async () => {
        let finalContent = postContent.trim()
        if (location.trim()) {
            finalContent = finalContent ? `${finalContent}\n\n📍 ${location.trim()}` : `📍 ${location.trim()}`
        }
        if ((!finalContent && selectedFiles.length === 0) || isPosting) return

        setIsPosting(true)
        try {
            await postService.createPost(finalContent, selectedFiles)
            filePreviews.forEach(p => URL.revokeObjectURL(p.url))
            setPostContent("")
            setSelectedFiles([])
            setFilePreviews([])
            setLocation("")
            window.dispatchEvent(new Event('feed-refresh'))
        } catch (error) {
            console.error('Error creating post:', error)
            alert('Failed to create post. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleCreatePost()
        }
    }

    const onEmojiClick = (emojiObject) => {
        setPostContent(prev => prev + emojiObject.emoji);
    };

    const handleAddPoll = () => {
        const question = pollQuestion.trim()
        const opts = pollOptions.filter(o => o.trim())
        if (!question || opts.length < 2) {
            toast.error("Add a question and at least 2 options")
            return
        }
        const pollText = `📊 Poll: ${question}\n${opts.map((o, i) => `${i + 1}. ${o.trim()}`).join("\n")}`
        setPostContent(prev => (prev ? `${prev}\n\n${pollText}` : pollText))
        setShowPollModal(false)
        setPollQuestion("")
        setPollOptions(["", ""])
        toast.success("Poll added to post")
    };

    const addPollOption = () => {
        if (pollOptions.length < 4) setPollOptions([...pollOptions, ""])
    };

    const removePollOption = (idx) => {
        if (pollOptions.length > 2) setPollOptions(pollOptions.filter((_, i) => i !== idx))
    };

    const handleScheduleConfirm = () => {
        if (!scheduledDate || !scheduledTime) {
            toast.error("Select date and time")
            return
        }
        const dt = new Date(`${scheduledDate}T${scheduledTime}`)
        if (dt <= new Date()) {
            toast.error("Schedule time must be in the future")
            return
        }
        toast.info(`Scheduling requires backend support. Your post will be published immediately. Scheduled time saved: ${dt.toLocaleString()}`)
        setShowScheduleModal(false)
        setScheduledDate("")
        setScheduledTime("")
    };

    const handleLocationSubmit = (e) => {
        e?.preventDefault()
        const val = locationInputRef.current?.value?.trim()
        if (val) {
            setLocation(val)
            setShowLocationInput(false)
            if (locationInputRef.current) locationInputRef.current.value = ''
            toast.success(`Location set: ${val}`)
        }
    };

    const canPost = postContent.trim() || selectedFiles.length > 0 || location.trim()


    const userName = user?.profile?.name || user?.name || 'User'
    const userAvatar = user?.profile?.avatar || user?.avatar || '/websplash.png'

    return (
        <div>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="flex border-b border-border/50">
                    <div
                        onClick={() => setActiveTab("for-you")}
                        className={cn("flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] font-bold relative", activeTab === "following" && "text-muted-foreground font-medium")}
                    >
                        {t('feed.for_you')}
                        {activeTab === "for-you" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full min-w-[56px]" />}
                    </div>
                    <div
                        onClick={() => setActiveTab("following")}
                        className={cn("flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] font-bold relative", activeTab === "for-you" && "text-muted-foreground font-medium")}
                    >
                        {t('common.following')}
                        {activeTab === "following" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-full" />}
                    </div>
                </div>
            </div>

            {/* Post Composer */}
            <div className="px-4 py-3 border-b border-border flex gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback>{userName[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full relative">
                    <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('right_sidebar.whats_happening')}
                        className="w-full bg-transparent outline-none text-[20px] placeholder-muted-foreground mb-3 text-foreground resize-none min-h-[60px]"
                        maxLength={280}
                    />

                    {/* Media Previews */}
                    {filePreviews.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                            {filePreviews.map((preview, index) => (
                                <div key={index} className="relative shrink-0">
                                    {preview.type === 'image' ? (
                                        <img src={preview.url} alt="Preview" className="h-24 w-auto rounded-xl object-cover border border-border" />
                                    ) : preview.type === 'video' ? (
                                        <video src={preview.url} className="h-24 w-auto rounded-xl object-cover border border-border" muted playsInline />
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

                    {location && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {location}
                            </span>
                            <button type="button" onClick={() => setLocation("")} className="text-muted-foreground hover:text-foreground p-0.5">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-border/20 pt-3">
                        <div className="flex gap-2 text-primary -ml-2 relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-primary/10 rounded-full transition"
                                title={t('feed.add_media') || 'Add media'}
                            >
                                <Image className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowPollModal(true)}
                                className="p-2 hover:bg-primary/10 rounded-full transition"
                                title={t('feed.add_poll') || 'Add poll'}
                            >
                                <AlignLeft className="w-5 h-5" />
                            </button>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 hover:bg-primary/10 rounded-full transition"
                                    title={t('feed.add_emoji') || 'Add emoji'}
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                                {showEmojiPicker && (
                                    <div className="absolute top-full left-0 z-50 mt-2 shadow-xl rounded-xl">
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

                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(true)}
                                className="p-2 hover:bg-primary/10 rounded-full transition"
                                title={t('feed.schedule') || 'Schedule post'}
                            >
                                <CalendarClock className="w-5 h-5" />
                            </button>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowLocationInput(!showLocationInput)}
                                    className={cn(
                                        "p-2 hover:bg-primary/10 rounded-full transition",
                                        location && "text-primary"
                                    )}
                                    title={t('feed.add_location') || 'Add location'}
                                >
                                    <MapPin className="w-5 h-5" />
                                </button>
                                {showLocationInput && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowLocationInput(false)} aria-hidden="true" />
                                        <div className="absolute left-0 top-full mt-2 z-50 flex gap-2 p-2 bg-background border border-border rounded-xl shadow-lg">
                                            <Input
                                            ref={locationInputRef}
                                            placeholder={t('feed.location_placeholder') || "e.g. New York"}
                                            className="w-40 h-9"
                                            onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit(e)}
                                        />
                                        <Button size="sm" onClick={handleLocationSubmit}>
                                            {t('common.add') || 'Add'}
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowLocationInput(false); setLocation("") }}
                                            className="p-1 hover:bg-muted rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {postContent.length > 0 && (
                                <span className={cn(
                                    "text-sm",
                                    postContent.length > 260 ? "text-red-500" : "text-muted-foreground"
                                )}>
                                    {postContent.length}/280
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleCreatePost}
                                disabled={!canPost || isPosting || postContent.length > 280}
                                className="bg-primary text-primary-foreground font-bold text-[15px] px-4 py-1.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPosting ? t('feed.posting') : t('nav.post')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Poll Modal */}
            <Dialog open={showPollModal} onOpenChange={setShowPollModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('feed.add_poll') || 'Add poll'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-sm font-medium block mb-2">{t('feed.poll_question') || 'Question'}</label>
                            <Input
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                placeholder={t('feed.poll_question_placeholder') || "What's your poll about?"}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-2">{t('feed.poll_options') || 'Options'}</label>
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <Input
                                        value={opt}
                                        onChange={(e) => setPollOptions(pollOptions.map((o, j) => j === i ? e.target.value : o))}
                                        placeholder={`${t('feed.option') || 'Option'} ${i + 1}`}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removePollOption(i)}
                                        disabled={pollOptions.length <= 2}
                                        className="shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {pollOptions.length < 4 && (
                                <Button type="button" variant="outline" size="sm" onClick={addPollOption}>
                                    + {t('feed.add_option') || 'Add option'}
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPollModal(false)}>{t('common.cancel') || 'Cancel'}</Button>
                        <Button onClick={handleAddPoll}>{t('feed.add_poll_confirm') || 'Add poll'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Modal */}
            <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('feed.schedule_post') || 'Schedule post'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <label className="text-sm font-medium block mb-2">{t('feed.date') || 'Date'}</label>
                            <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 10)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-2">{t('feed.time') || 'Time'}</label>
                            <Input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('feed.schedule_note') || 'Note: Scheduling requires backend support. Your post will be published immediately.'}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScheduleModal(false)}>{t('common.cancel') || 'Cancel'}</Button>
                        <Button onClick={handleScheduleConfirm}>{t('feed.schedule') || 'Schedule'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Feed tab={activeTab} />
        </div>
    )
}
