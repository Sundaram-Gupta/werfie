import { Feed } from "@/components/feed/feed"
import { Image, AlignLeft, CalendarClock, Smile, MapPin, X } from "lucide-react"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { postService, mediaService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import EmojiPicker from 'emoji-picker-react';
import { useTranslation } from "react-i18next"

export default function Home() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState("for-you")
    const [postContent, setPostContent] = useState("")
    const [isPosting, setIsPosting] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [mediaUrls, setMediaUrls] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef(null)
    const { user } = useAuth()

    const handleCreatePost = async () => {
        if ((!postContent.trim() && mediaUrls.length === 0) || isPosting) return

        setIsPosting(true)
        try {
            await postService.createPost(postContent.trim(), mediaUrls)
            setPostContent("")
            setMediaUrls([])
            // Refresh the feed
            window.location.reload()
        } catch (error) {
            console.error('Error creating post:', error)
            alert('Failed to create post. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Max size is 5MB.")
            return
        }

        setIsUploading(true)
        try {
            const { url } = await mediaService.uploadMedia(file)
            setMediaUrls([...mediaUrls, url])
        } catch (error) {
            console.error('Upload failed:', error)
            alert("Failed to upload image.")
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeMedia = (index) => {
        setMediaUrls(mediaUrls.filter((_, i) => i !== index))
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleCreatePost()
        }
    }

    const onEmojiClick = (emojiObject) => {
        setPostContent(prev => prev + emojiObject.emoji);
        // Don't close picker automatically to allow multiple emojis
    };

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
                    {mediaUrls.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                            {mediaUrls.map((url, index) => (
                                <div key={index} className="relative">
                                    <img src={url} alt="Upload" className="h-24 w-auto rounded-xl object-cover border border-border" />
                                    <button
                                        onClick={() => removeMedia(index)}
                                        className="absolute -top-1 -right-1 bg-black/70 rounded-full p-0.5 text-white hover:bg-black/90"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isUploading && <div className="text-sm text-primary mb-2">{t('feed.uploading')}</div>}

                    <div className="flex justify-between items-center border-t border-border/20 pt-3">
                        <div className="flex gap-2 text-primary -ml-2 relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-primary/10 rounded-full transition"
                            >
                                <Image className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-primary/10 rounded-full transition"><AlignLeft className="w-5 h-5" /></button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 hover:bg-primary/10 rounded-full transition"
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

                            <button className="p-2 hover:bg-primary/10 rounded-full transition"><CalendarClock className="w-5 h-5" /></button>
                            <button className="p-2 hover:bg-primary/10 rounded-full transition opacity-50"><MapPin className="w-5 h-5" /></button>
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
                                onClick={handleCreatePost}
                                disabled={(!postContent.trim() && mediaUrls.length === 0) || isPosting || postContent.length > 280 || isUploading}
                                className="bg-primary text-primary-foreground font-bold text-[15px] px-4 py-1.5 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPosting ? t('feed.posting') : t('nav.post')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Feed tab={activeTab} />
        </div>
    )
}
