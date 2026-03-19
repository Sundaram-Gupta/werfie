import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Image, X, MapPin, Smile, FileBarChart2, CalendarClock, Globe } from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"
import { useAuth } from "@/context/AuthContext"
import { postService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { ArticlePreviewCard } from "./article-preview-card"

export function ComposeModal({ children, initialContent = "" }) {
    const [postContent, setPostContent] = useState(initialContent)
    
    // Update content when prop changes (e.g. sharing different articles)
    useEffect(() => {
        if (initialContent) setPostContent(initialContent)
    }, [initialContent])

    const [open, setOpen] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [filePreviews, setFilePreviews] = useState([])
    const fileInputRef = useRef(null)
    const textareaRef = useRef(null)
    const { user } = useAuth()
    const { t } = useTranslation()

    // Detect article links for preview cards
    const articleId = useMemo(() => {
        if (typeof postContent !== 'string') return null;
        // Match /article/UUID or /article/ID
        const match = postContent.match(/\/article\/([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    }, [postContent]);

    const MAX_CHARS = 280
    const progress = (postContent.length / MAX_CHARS) * 100
    const isOverLimit = postContent.length > MAX_CHARS
    const isEmpty = postContent.trim().length === 0 && selectedFiles.length === 0

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

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setSelectedFiles(files)
        
        // Generate previews
        const previews = files.map(file => {
            let type = 'image';
            if (file.type.startsWith('video/')) type = 'video';
            if (file.type.startsWith('audio/')) type = 'audio';
            
            return {
                file,
                url: URL.createObjectURL(file),
                type
            }
        })
        setFilePreviews(previews)
    }

    const handleRemoveFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index)
        const newPreviews = filePreviews.filter((_, i) => i !== index)
        
        // Revoke URL to free memory
        URL.revokeObjectURL(filePreviews[index].url)
        
        setSelectedFiles(newFiles)
        setFilePreviews(newPreviews)
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
        if ((isEmpty || isPosting)) return

        setIsPosting(true)
        try {
            await postService.createPost(postContent.trim(), selectedFiles)
            setPostContent("")
            setSelectedFiles([])
            setFilePreviews([])
            setOpen(false)
            window.dispatchEvent(new Event('feed-refresh'))
        } catch (error) {
            console.error('Error creating post:', error)
            alert('Failed to create post. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    const userHandle = user?.profile?.handle || user?.handle || user?.email?.split('@')[0] || 'user'
    const userName = user?.profile?.name || user?.name || (userHandle ? userHandle.charAt(0).toUpperCase() + userHandle.slice(1) : 'User')
    const userAvatar = user?.profile?.avatar || user?.avatar || null

    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-black border-[rgb(47,51,54)] p-0 gap-0 top-[20%] translate-y-0 sm:top-[5%] sm:translate-y-0 text-white [&>button]:hidden">
                <VisuallyHidden>
                    <DialogTitle>Compose Post</DialogTitle>
                    <DialogDescription>Create a new post with text and media</DialogDescription>
                </VisuallyHidden>
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
                                <AvatarImage src={getMediaUrl(userAvatar)} />
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

                            {/* Article Preview Card */}
                            {articleId && (
                                <div className="mb-4">
                                    <ArticlePreviewCard articleId={articleId} />
                                </div>
                            )}

                            {/* Media Previews */}
                            {filePreviews.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    {filePreviews.map((preview, index) => (
                                        <div key={index} className="relative rounded-2xl overflow-hidden bg-[rgb(22,24,28)] border border-[rgb(47,51,54)]">
                                            {preview.type === 'image' ? (
                                                <img src={preview.url} alt="Preview" className="w-full h-48 object-cover" />
                                            ) : preview.type === 'video' ? (
                                                <video src={preview.url} className="w-full h-48 object-cover" controls />
                                            ) : (
                                                 <div className="w-full h-48 flex items-center justify-center bg-gray-900">
                                                    <audio src={preview.url} controls className="w-full px-2" />
                                                 </div>
                                            )}
                                            <button
                                                onClick={() => handleRemoveFile(index)}
                                                className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1.5 transition-colors"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*,audio/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />


                            <div className="border-b border-[rgb(47,51,54)] pb-3 mb-3">
                                <button className="flex items-center gap-1 text-blue-500 hover:bg-blue-500/10 px-3 py-1 -ml-3 rounded-full transition-colors w-fit">
                                    <Globe className="w-4 h-4" />
                                    <span className="font-bold text-[15px]">{t('feed.everyone_can_reply')}</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <div className="flex gap-0 text-blue-500 -ml-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 hover:bg-blue-500/10 rounded-full transition-colors"
                                    >
                                        <Image className="w-5 h-5" />
                                    </button>
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
                                         disabled={isEmpty || isOverLimit || isPosting}
                                        className="bg-[rgb(29,155,240)] hover:bg-[rgb(26,140,216)] text-white font-bold rounded-full px-5 py-2 h-auto text-[15px] disabled:opacity-50 disabled:bg-[rgb(29,155,240)]"
                                        onClick={handleCreatePost}
                                    >
                                    
                                        {isPosting ? t('feed.posting') : t('nav.post')}
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
