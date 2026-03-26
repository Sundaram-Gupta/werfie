import { MessageCircle, Repeat2, Heart, Bookmark, Share, BarChart2, Link2, MessageSquareShare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReplyModal } from "./reply-modal"
import { ShareModal } from "./share-modal"
import { PostAnalyticsModal } from "./post-analytics-modal"
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function PostActions({ stats, post, currentUserId, onLike, onUnlike, onRetweet, onUnretweet, onBookmark, onUnbookmark }) {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)
    const postUrl = `${window.location.origin}/post/${post.id}`
    // Use post data from props (updated by parent via usePosts hook)
    const likes = post._count?.likes || stats.likes || 0
    // Check if current user has liked (backend returns array with user's like if exists)
    const isLiked = post.likes && post.likes.length > 0
    const reposts = post._count?.retweets || stats.reposts || 0
    // Check if current user has retweeted
    const isRetweeted = post.retweets && post.retweets.length > 0
    // Check if current user has bookmarked (backend sends bookmarks[] or we set from optimistic update)
    const isBookmarked = Array.isArray(post.bookmarks) && post.bookmarks.length > 0
    // Only the author can see analytics
    const postOwnerId = post.userId || post.user?.id
    const isOwnPost = !!(currentUserId && postOwnerId && currentUserId === postOwnerId)

    const handleBookmark = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (isBookmarked && onUnbookmark) {
            await onUnbookmark(post.id)
        } else if (!isBookmarked && onBookmark) {
            await onBookmark(post.id)
        }
    }

    const handleLike = async (e) => {
        e.preventDefault() // Prevent navigating to post detail if parent is a link
        e.stopPropagation()

        if (isLiked && onUnlike) {
            await onUnlike(post.id)
        } else if (!isLiked && onLike) {
            await onLike(post.id)
        }
    }

    const handleRepost = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (isRetweeted && onUnretweet) {
            await onUnretweet(post.id)
        } else if (!isRetweeted && onRetweet) {
            await onRetweet(post.id)
        }
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num
    }

    return (
        <div className="flex justify-between items-center mt-3 mb-1 text-muted-foreground w-full">
            <ReplyModal post={post}>
                <button className="flex items-center group hover:text-blue-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <div className="w-[34px] h-[34px] flex items-center justify-center rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </div>
                    <span className="text-[13px] group-hover:text-blue-500">{formatNumber(stats.comments) || ''}</span>
                </button>
            </ReplyModal>

            <button onClick={handleRepost} className={cn("flex items-center group hover:text-green-500 transition-colors", isRetweeted && "text-green-500")}>
                <div className="w-[34px] h-[34px] flex items-center justify-center rounded-full group-hover:bg-green-500/10 transition-colors">
                    <Repeat2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                <span className="text-[13px]">{formatNumber(reposts) || ''}</span>
            </button>

            <button onClick={handleLike} className={cn("flex items-center group hover:text-pink-500 transition-colors", isLiked && "text-pink-500")}>
                <div className="w-[34px] h-[34px] flex items-center justify-center rounded-full group-hover:bg-pink-500/10 transition-colors">
                    <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} strokeWidth={1.75} />
                </div>
                <span className="text-[13px]">{formatNumber(likes) || ''}</span>
            </button>

            <button
                className={cn(
                    "flex items-center group transition-colors",
                    isOwnPost ? "hover:text-blue-500 cursor-pointer" : "cursor-default opacity-80"
                )}
                onClick={(e) => {
                    e.stopPropagation()
                    if (isOwnPost) setIsAnalyticsModalOpen(true)
                }}
                aria-label={isOwnPost ? "View post analytics" : "Views"}
                title={isOwnPost ? "View analytics" : "Views"}
            >
                <div className={cn(
                    "w-[34px] h-[34px] flex items-center justify-center rounded-full transition-colors",
                    isOwnPost && "group-hover:bg-blue-500/10"
                )}>
                    <BarChart2 className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                <span className="text-[13px]">{stats.views || '0'}</span>
            </button>

            <button
                onClick={handleBookmark}
                className={cn("flex items-center group hover:text-blue-500 transition-colors", isBookmarked && "text-blue-500")}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
                <div className="w-[34px] h-[34px] flex items-center justify-center rounded-full group-hover:bg-blue-500/10 transition-colors">
                    <Bookmark className={cn("w-[18px] h-[18px]", isBookmarked && "fill-current")} strokeWidth={1.75} />
                </div>
            </button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center group hover:text-blue-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <div className="w-[34px] h-[34px] flex items-center justify-center rounded-full group-hover:bg-blue-500/10 transition-colors">
                            <Share className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] bg-[#15202b] border-[#38444d] text-foreground">
                    <DropdownMenuItem 
                        className="flex items-center gap-3 py-3 cursor-pointer hover:bg-white/[0.03] focus:bg-white/[0.03]"
                        onClick={(e) => {
                            e.stopPropagation();
                            const postUrl = `${window.location.origin}/post/${post.id}`;
                            navigator.clipboard.writeText(postUrl);
                            toast.success("Link copied to clipboard");
                        }}
                    >
                        <Link2 className="w-4 h-4" />
                        <span className="font-medium">Copy link</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="flex items-center gap-3 py-3 cursor-pointer hover:bg-white/[0.03] focus:bg-white/[0.03]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsShareModalOpen(true);
                        }}
                    >
                        <MessageSquareShare className="w-4 h-4" />
                        <span className="font-medium">Share via chat</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                post={post}
                postUrl={postUrl} 
            />

            <PostAnalyticsModal 
                open={isAnalyticsModalOpen} 
                onOpenChange={setIsAnalyticsModalOpen} 
                post={post} 
            />
        </div>
    )
}
