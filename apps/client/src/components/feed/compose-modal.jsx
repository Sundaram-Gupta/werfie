import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Image, X, MapPin, Smile, FileBarChart2, CalendarClock, Globe } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { postService, mediaService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"

export function ComposeModal({ children }) {
    const [postContent, setPostContent] = useState("")
    const [open, setOpen] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [mediaUrls, setMediaUrls] = useState([])
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const textareaRef = useRef(null)
    const fileInputRef = useRef(null)
    const { user } = useAuth()
    const { t } = useTranslation()

    const MAX_CHARS = 280
    const progress = (postContent.length / MAX_CHARS) * 100
    const isOverLimit = postContent.length > MAX_CHARS
    const isEmpty = postContent.trim().length === 0

    const adjustHeight = () => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = "auto"
            textarea.style.height = `${textarea.scrollHeight}px`
        }
    }

    useEffect(() => {
        adjustHeight()
    }, [postContent])

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setUploadingMedia(true)
        try {
            const uploadPromises = files.map(file => mediaService.uploadMedia(file))
            const results = await Promise.all(uploadPromises)
            const urls = results.map(r => r.url)
            setMediaUrls(prev => [...prev, ...urls])
        } catch (error) {
            console.error('Error uploading media:', error)
            alert('Failed to upload media. Please try again.')
        } finally {
            setUploadingMedia(false)
        }
    }

    const handleRemoveMedia = (index) => {
        setMediaUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleEmojiClick = (emoji) => {
        const textarea = textareaRef.current
        if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newContent = postContent.substring(0, start) + emoji + postContent.substring(end)
            setPostContent(newContent)
            // Set cursor position after emoji
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length
                textarea.focus()
            }, 0)
        }
        setShowEmojiPicker(false)
    }

    const handleCreatePost = async () => {
        if ((!postContent.trim() && mediaUrls.length === 0) || isPosting) return

        setIsPosting(true)
        try {
            await postService.createPost(postContent.trim(), mediaUrls)
            setPostContent("")
            setMediaUrls([])
            setOpen(false)
            // Refresh the feed
            window.location.reload()
        } catch (error) {
            console.error('Error creating post:', error)
            alert('Failed to create post. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    const userName = user?.profile?.name || user?.name || 'User'
    const userAvatar = user?.profile?.avatar || user?.avatar || '/websplash.png'

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-black border-[rgb(47,51,54)] p-0 gap-0 top-[20%] translate-y-0 sm:top-[5%] sm:translate-y-0 text-white [&>button]:hidden">
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
                                <AvatarImage src={userAvatar} />
                                <AvatarFallback>{userName[0]?.toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex-1 pb-6">
                            <textarea
                                ref={textareaRef}
                                className="w-full bg-transparent border-none outline-none text-[20px] placeholder-[rgb(113,118,123)] resize-none min-h-[120px] text-white mt-2"
                                placeholder={t('right_sidebar.whats_happening')}
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            />

                            {/* Media Preview */}
                            {mediaUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3 rounded-2xl overflow-hidden">
                                    {mediaUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img src={getMediaUrl(url)} alt="Upload" className="w-full h-auto rounded-2xl" />
                                            <button
                                                onClick={() => handleRemoveMedia(index)}
                                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-b border-[rgb(47,51,54)] pb-3 mb-3">
                                <button className="flex items-center gap-1 text-blue-500 hover:bg-blue-500/10 px-3 py-1 -ml-3 rounded-full transition-colors w-fit">
                                    <Globe className="w-4 h-4" />
                                    <span className="font-bold text-[15px]">{t('feed.everyone_can_reply')}</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex gap-0 text-blue-500 -ml-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleImageUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingMedia}
                                        className="p-2 hover:bg-blue-500/10 rounded-full transition-colors disabled:opacity-50"
                                    >
                                        <Image className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><FileBarChart2 className="w-5 h-5" /></button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 mb-2 bg-black border border-[rgb(47,51,54)] rounded-2xl p-3 shadow-2xl z-[100] min-w-[280px]">
                                                <div className="grid grid-cols-8 gap-1">
                                                    {['😀', '😂', '😍', '🥰', '😎', '🤔', '😭', '😡', '👍', '👎', '🙏', '💪', '🎉', '🔥', '❤️', '💯', '✨', '🚀', '👀', '💀', '🤝', '🙌', '👏', '💡'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleEmojiClick(emoji)}
                                                            className="text-2xl hover:bg-white/10 rounded p-1 transition-colors w-10 h-10 flex items-center justify-center"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><CalendarClock className="w-5 h-5" /></button>
                                    <button className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"><MapPin className="w-5 h-5 opacity-50" /></button>
                                </div>

                                <div className="flex items-center gap-4">
                                    {postContent.length > 0 && (
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
                                        disabled={(isEmpty && mediaUrls.length === 0) || isOverLimit || isPosting || uploadingMedia}
                                        className="bg-[rgb(29,155,240)] hover:bg-[rgb(26,140,216)] text-white font-bold rounded-full px-5 py-2 h-auto text-[15px] disabled:opacity-50 disabled:bg-[rgb(29,155,240)]"
                                        onClick={handleCreatePost}
                                    >
                                    >
                                        {uploadingMedia ? t('feed.uploading') : (isPosting ? t('feed.posting') : t('nav.post'))}
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
