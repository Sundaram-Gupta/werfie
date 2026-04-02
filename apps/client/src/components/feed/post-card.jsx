import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { PostActions } from "./post-actions"
import { MoreOptionsDropdown } from "./more-options-dropdown"
import { SubmitAppealModal } from "@/components/modals/SubmitAppealModal"
import { ShieldAlert } from "lucide-react"

import { getMediaUrl } from "@/lib/utils"
import { PollDisplay } from "./poll-display"
import { parsePollContent } from "@/lib/poll-utils"

const CONTENT_SERVICE_URL = import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:3003'
import { useTranslation } from "react-i18next"

export function PostCard({ post, onLike, onUnlike, onRetweet, onUnretweet, onBookmark, onUnbookmark, onDelete }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false)
    
    const handleUserClick = (e) => {
        e.stopPropagation()
        const userId = post.user?.id || post.userId
        if (userId) {
            navigate(`/profile/${userId}`)
        }
    }

    // Handle backend data structure
    // Backend returns: { id, userId, content, createdAt, user: { id, profile: { name, handle } } }
    // Frontend expects: { id, user: { name, handle, avatar }, content, timestamp, stats }

    const user = {
        id: post.user?.id || post.userId,
        userId: post.user?.id || post.userId,
        name: post.user?.profile?.name || post.user?.name || 'Unknown User',
        handle: post.user?.profile?.handle || post.user?.handle || 'unknown',
        avatar: post.user?.profile?.avatar || post.user?.avatar || '/websplash.png',
        verified: post.user?.profile?.verified || post.user?.verified || false
    }

    // Format timestamp
    const getRelativeTime = (dateString) => {
        if (!dateString) return 'now'
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now - date) / 1000)

        if (seconds < 60) return `${seconds}${t('time.s')}`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}${t('time.m')}`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}${t('time.h')}`
        const days = Math.floor(hours / 24)
        return `${days}${t('time.d')}`
    }

    const timestamp = getRelativeTime(post.createdAt || post.timestamp)

    // Format stats
    const stats = {
        comments: post._count?.replies || post.stats?.comments || 0,
        reposts: post._count?.retweets || post.stats?.reposts || 0,
        likes: post._count?.likes || post.stats?.likes || 0,
        views: post.stats?.views || '0'
    }



    return (
        <div className="flex gap-3 px-4 py-3 border-b border-border hover:bg-white/[0.03] transition-colors cursor-pointer">
            {/* User avatar column */}
            <div className="flex-shrink-0" onClick={handleUserClick}>
                <Avatar className="w-10 h-10 hover:opacity-90 transition-opacity">
                    <AvatarImage src={getMediaUrl(user.avatar)} />
                    <AvatarFallback>{user.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            </div>

            {/* Main content column */}
            <div className="flex-1 min-w-0">
                {/* Header: user info and more options */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-hidden text-[15px]" onClick={handleUserClick}>
                        <span className="font-bold truncate text-foreground hover:underline">{user.name}</span>
                        {user.verified && <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />}
                        <span className="text-muted-foreground truncate hover:underline">@{user.handle}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground whitespace-nowrap">{timestamp}</span>
                    </div>
                    <MoreOptionsDropdown user={user} contentId={post.id} post={post} onDelete={onDelete} />
                </div>

                {/* Removed Post UI */}
                {(post.status === 'REMOVED' || post.moderationStatus === 'REMOVED' || post.deleted) ? (
                    <div className="mt-2 mb-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-[15px] font-bold text-red-500">This post was removed</h4>
                                <p className="text-[14px] text-red-400/90 mt-1">
                                    It violates the Werfie Terms of Service. If you believe this is an error, you can submit an appeal.
                                </p>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsAppealModalOpen(true); }}
                                    className="mt-3 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold rounded-full transition-colors"
                                >
                                    Submit Appeal
                                </button>
                                
                                <SubmitAppealModal 
                                    isOpen={isAppealModalOpen}
                                    onClose={() => setIsAppealModalOpen(false)}
                                    defaultType="Post Removal"
                                    targetId={post.id}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Reply indicator */}
                {post.replyToId && (
                    <p className="text-[13px] text-muted-foreground mt-0.5 mb-0.5">
                        {t('feed.replying_to') || 'Replying to'}{' '}
                        <span className="text-primary">
                            @{post.replyToHandle || post.replyTo?.user?.profile?.handle || post.replyTo?.user?.handle || 'unknown'}
                        </span>
                    </p>
                )}

                {/* Post content: poll or plain text */}
                {(() => {
                    const raw = post.content ?? post.text ?? post.body ?? post.data?.content ?? ''
                    const text = typeof raw === 'object' ? JSON.stringify(raw) : String(raw ?? '')
                    const parsed = parsePollContent(text)
                    if (parsed) {
                        return <PollDisplay content={text} createdAt={post.createdAt || post.timestamp} />
                    }
                    return (
                        <div className="text-[15px] leading-5 whitespace-pre-wrap break-words text-foreground mt-0.5">
                            {text}
                        </div>
                    )
                })()}

                {/* Media Attachments */}
                {post.media && post.media.length > 0 && (
                    <div className={`mt-3 rounded-2xl overflow-hidden border border-border ${
                        post.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
                    }`}>
                        {post.media.map((media, index) => {
                            // Handle both R2 URLs (absolute) and local URLs (relative)
                            const mediaUrl = media.mediaUrl?.startsWith('http') 
                                ? media.mediaUrl 
                                : `${CONTENT_SERVICE_URL}${media.mediaUrl}`;
                            const thumbnailUrl = media.thumbnailUrl?.startsWith('http')
                                ? media.thumbnailUrl
                                : media.thumbnailUrl ? `${CONTENT_SERVICE_URL}${media.thumbnailUrl}` : null;

                            return (
                                <div key={media.id || index} className="relative bg-black">
                                    {media.mediaType === 'image' ? (
                                        <img
                                            src={mediaUrl}
                                            alt="Post media"
                                            className="w-full h-auto object-cover"
                                            style={{ maxHeight: post.media.length === 1 ? '500px' : '250px' }}
                                            onError={(e) => {
                                                console.error('Image load failed:', mediaUrl);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <video
                                            src={mediaUrl}
                                            poster={thumbnailUrl}
                                            controls
                                            className="w-full h-auto"
                                            style={{ maxHeight: post.media.length === 1 ? '500px' : '250px' }}
                                            onError={(e) => {
                                                console.error('Video load failed:', mediaUrl);
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}



                {/* Post interaction buttons */}
                <PostActions
                    stats={stats}
                    post={post}
                    onLike={onLike}
                    onUnlike={onUnlike}
                    onRetweet={onRetweet}
                    onUnretweet={onUnretweet}
                    onBookmark={onBookmark}
                    onUnbookmark={onUnbookmark}
                />
                </>
                )}
            </div>
        </div>
    )
}
