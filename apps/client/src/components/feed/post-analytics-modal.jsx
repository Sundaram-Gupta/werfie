import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck, Heart, Repeat2, MessageCircle, Info } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export function PostAnalyticsModal({ open, onOpenChange, post }) {
    const { t } = useTranslation()

    if (!post) return null

    const user = {
        name: post.user?.profile?.name || post.user?.name || 'Unknown User',
        handle: post.user?.profile?.handle || post.user?.handle || 'unknown',
        avatar: post.user?.profile?.avatar || post.user?.avatar || '/websplash.png',
        verified: post.user?.profile?.verified || post.user?.verified || false
    }

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
    const rawContent = post.content ?? post.text ?? post.body ?? post.data?.content ?? ''
    const content = typeof rawContent === 'object' ? JSON.stringify(rawContent) : String(rawContent ?? '')

    const likes = post._count?.likes ?? post.stats?.likes ?? 0
    const reposts = post._count?.retweets ?? post.stats?.reposts ?? 0
    const replies = post._count?.replies ?? post.stats?.comments ?? 0
    const impressions = post.stats?.views ?? post.stats?.impressions ?? post.impressions ?? 0
    const engagements = likes + reposts + replies

    const MetricItem = ({ label, value }) => (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <span>{label}</span>
                <Info className="w-[14px] h-[14px]" />
            </div>
            <span className="text-xl font-bold">{value}</span>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-black border border-border text-foreground z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Post Analytics</DialogTitle>
                    <DialogDescription className="sr-only">View engagement stats for this post</DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Post preview */}
                    <div className="flex gap-3 border-b border-border pb-4">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={getMediaUrl(user.avatar)} />
                            <AvatarFallback>{user.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[15px]">
                                <span className="font-bold">{user.name}</span>
                                {user.verified && <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />}
                                <span className="text-muted-foreground">@{user.handle}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="text-muted-foreground">{timestamp}</span>
                            </div>
                            <p className="text-[15px] whitespace-pre-wrap break-words mt-0.5">{content || ' '}</p>
                        </div>
                    </div>

                    {/* Basic interaction counts */}
                    <div className="flex justify-around py-4 border-b border-border">
                        <div className="flex flex-col items-center gap-1">
                            <Heart className="w-6 h-6 text-muted-foreground" />
                            <span className="text-lg font-bold">{likes}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Repeat2 className="w-6 h-6 text-muted-foreground" />
                            <span className="text-lg font-bold">{reposts}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <MessageCircle className="w-6 h-6 text-muted-foreground" />
                            <span className="text-lg font-bold">{replies}</span>
                        </div>
                    </div>

                    {/* Detailed metrics */}
                    <div className="grid grid-cols-2 gap-6">
                        <MetricItem label="Impressions" value={impressions} />
                        <MetricItem label="Engagements" value={engagements} />
                        <MetricItem label="Detail expands" value="0" />
                        <MetricItem label="Profile visits" value="0" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
