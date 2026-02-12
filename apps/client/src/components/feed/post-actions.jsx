import { MessageCircle, Repeat2, Heart, Share, BarChart2, Link2, MessageSquareShare } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReplyModal } from "./reply-modal"
import { ShareModal } from "./share-modal"
import { useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function PostActions({ stats, post, onLike, onUnlike, onRetweet, onUnretweet }) {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const postUrl = `${window.location.origin}/post/${post.id}`
    // Use post data from props (updated by parent via usePosts hook)
    const likes = post._count?.likes || stats.likes || 0
    // Check if current user has liked (backend returns array with user's like if exists)
    const isLiked = post.likes && post.likes.length > 0
    const reposts = post._count?.retweets || stats.reposts || 0
    // Check if current user has retweeted
    const isRetweeted = post.retweets && post.retweets.length > 0

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
        <div className="flex justify-between mt-1 text-muted-foreground w-full max-w-[425px]">
            <ReplyModal post={post}>
                <button className="flex items-center gap-3 group hover:text-blue-500 transition-colors -ml-2" onClick={(e) => e.stopPropagation()}>
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                        <MessageCircle className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[13px] group-hover:text-blue-500 leading-4">{formatNumber(stats.comments)}</span>
                </button>
            </ReplyModal>

            <button onClick={handleRepost} className={cn("flex items-center gap-3 group hover:text-green-500 transition-colors", isRetweeted && "text-green-500")}>
                <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                    <Repeat2 className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[13px] leading-4">{formatNumber(reposts)}</span>
            </button>

            <button onClick={handleLike} className={cn("flex items-center gap-3 group hover:text-pink-500 transition-colors", isLiked && "text-pink-500")}>
                <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
                    <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} />
                </div>
                <span className="text-[13px] leading-4">{formatNumber(likes)}</span>
            </button>

            <button className="flex items-center gap-3 group hover:text-blue-500 transition-colors">
                <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                    <BarChart2 className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[13px] leading-4">{stats.views}</span>
            </button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 group hover:text-blue-500 transition-colors -mr-2" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                            <Share className="w-[18px] h-[18px]" />
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
                postUrl={postUrl} 
            />
        </div>
    )
}
