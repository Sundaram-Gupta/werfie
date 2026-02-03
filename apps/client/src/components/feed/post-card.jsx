import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck } from "lucide-react"
import { PostActions } from "./post-actions"
import { MoreOptionsDropdown } from "./more-options-dropdown"
import { getMediaUrl } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export function PostCard({ post, onLike, onUnlike, onRetweet, onUnretweet }) {
    const { t } = useTranslation()
    // Handle backend data structure
    // Backend returns: { id, userId, content, createdAt, user: { id, profile: { name, handle } } }
    // Frontend expects: { id, user: { name, handle, avatar }, content, timestamp, stats }

    const user = {
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

    // Parse media URLs
    let mediaUrls = []
    try {
        if (post.mediaUrls) {
            // Backend stores as JSON string
            mediaUrls = typeof post.mediaUrls === 'string'
                ? JSON.parse(post.mediaUrls)
                : post.mediaUrls
        } else if (post.image) {
            // Legacy single image support
            mediaUrls = [post.image]
        }
    } catch (e) {
        console.error('Failed to parse mediaUrls:', e)
    }

    return (
        <div className="flex gap-3 px-4 py-3 border-b border-border hover:bg-white/[0.03] transition-colors cursor-pointer">
            {/* User avatar column */}
            <div className="flex-shrink-0">
                <Avatar className="w-10 h-10">
                    <AvatarImage src={getMediaUrl(user.avatar)} />
                    <AvatarFallback>{user.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            </div>

            {/* Main content column */}
            <div className="flex-1 min-w-0">
                {/* Header: user info and more options */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-hidden text-[15px]">
                        <span className="font-bold truncate text-foreground">{user.name}</span>
                        {user.verified && <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />}
                        <span className="text-muted-foreground truncate">@{user.handle}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground whitespace-nowrap">{timestamp}</span>
                    </div>
                    <MoreOptionsDropdown user={user} contentId={post.id} />
                </div>

                {/* Post content text */}
                <div className="text-[15px] leading-5 whitespace-pre-wrap break-words text-foreground mt-0.5">
                    {post.content}
                </div>

                {/* Post images (support multiple images) */}
                {mediaUrls.length > 0 && (
                    <div className={`mt-3 rounded-2xl overflow-hidden border border-border/50 ${mediaUrls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
                        }`}>
                        {mediaUrls.map((url, index) => (
                            <img
                                key={index}
                                src={getMediaUrl(url)}
                                alt={`Post media ${index + 1}`}
                                className="w-full h-auto object-cover max-h-[500px]"
                                loading="lazy"
                                onError={(e) => {
                                    console.error('Image failed to load:', url)
                                    e.target.style.display = 'none'
                                }}
                            />
                        ))}
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
                />
            </div>
        </div>
    )
}
