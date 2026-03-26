import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BadgeCheck, Heart, Repeat2, MessageCircle, Bookmark, BarChart2, TrendingUp, Users, MousePointerClick, Info, Loader2 } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import api from "@/lib/api"

export function PostAnalyticsModal({ open, onOpenChange, post }) {
    const { t } = useTranslation()
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!open || !post?.id) return
        setLoading(true)
        setError(null)
        setAnalytics(null)

        api.get(`/api/posts/${post.id}/analytics`)
            .then(res => {
                // axios interceptor already unwraps { status, data } -> data
                setAnalytics(res.data)
            })
            .catch(err => {
                console.error('[PostAnalyticsModal] Failed to fetch analytics:', err)
                setError('Failed to load analytics. Showing local data.')
                // Fallback to local post data
                setAnalytics(null)
            })
            .finally(() => setLoading(false))
    }, [open, post?.id])

    if (!post) return null

    // Use API data or fall back to local post props
    const a = analytics
    const user = {
        name: a?.author?.name || post.user?.profile?.name || post.user?.name || 'Unknown User',
        handle: a?.author?.handle || post.user?.profile?.handle || post.user?.handle || 'unknown',
        avatar: a?.author?.avatar || post.user?.profile?.avatar || post.user?.avatar || null,
        verified: a?.author?.verified ?? post.user?.profile?.verified ?? post.user?.verified ?? false
    }

    const metrics = a?.metrics || {
        likes: post._count?.likes ?? post.stats?.likes ?? 0,
        reposts: post._count?.retweets ?? post.stats?.reposts ?? 0,
        replies: post._count?.replies ?? post.stats?.comments ?? 0,
        bookmarks: post._count?.bookmarks ?? 0,
        engagements: 0,
        impressions: post.stats?.views ?? post.stats?.impressions ?? post.impressions ?? 0,
        profileVisits: 0,
        detailExpands: 0,
        linkClicks: 0,
    }
    if (!a) {
        metrics.engagements = metrics.likes + metrics.reposts + metrics.replies + metrics.bookmarks
    }

    const recentLikers = a?.recentLikers || []

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

    const timestamp = getRelativeTime(a?.createdAt || post.createdAt || post.timestamp)
    const rawContent = a?.content ?? post.content ?? post.text ?? post.body ?? post.data?.content ?? ''
    const content = typeof rawContent === 'object' ? JSON.stringify(rawContent) : String(rawContent ?? '')

    const formatNumber = (n) => {
        if (!n) return '0'
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
        return String(n)
    }

    const MetricItem = ({ icon: Icon, label, value, color = "text-muted-foreground" }) => (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span>{label}</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">{formatNumber(value)}</span>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-black border border-border text-foreground z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        Post Analytics
                    </DialogTitle>
                    <DialogDescription className="sr-only">View engagement stats for this post</DialogDescription>
                </DialogHeader>

                {/* Post preview */}
                <div className="flex gap-3 border-b border-border pb-4">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={getMediaUrl(user.avatar)} />
                        <AvatarFallback>{user.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-[15px] flex-wrap">
                            <span className="font-bold">{user.name}</span>
                            {user.verified && <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />}
                            <span className="text-muted-foreground">@{user.handle}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">{timestamp}</span>
                        </div>
                        <p className="text-[15px] whitespace-pre-wrap break-words mt-0.5 line-clamp-3">
                            {content || ' '}
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading analytics...</span>
                    </div>
                )}

                {error && !loading && (
                    <p className="text-xs text-amber-400 text-center py-1 px-2 bg-amber-400/10 rounded-lg">{error}</p>
                )}

                {!loading && (
                    <div className="space-y-4">
                        {/* Big 4 interaction counts */}
                        <div className="flex justify-around py-3 border-b border-border">
                            <div className="flex flex-col items-center gap-1">
                                <Heart className="w-5 h-5 text-pink-500" />
                                <span className="text-lg font-bold">{formatNumber(metrics.likes)}</span>
                                <span className="text-xs text-muted-foreground">Likes</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Repeat2 className="w-5 h-5 text-green-500" />
                                <span className="text-lg font-bold">{formatNumber(metrics.reposts)}</span>
                                <span className="text-xs text-muted-foreground">Reposts</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <MessageCircle className="w-5 h-5 text-blue-400" />
                                <span className="text-lg font-bold">{formatNumber(metrics.replies)}</span>
                                <span className="text-xs text-muted-foreground">Replies</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Bookmark className="w-5 h-5 text-yellow-500" />
                                <span className="text-lg font-bold">{formatNumber(metrics.bookmarks)}</span>
                                <span className="text-xs text-muted-foreground">Bookmarks</span>
                            </div>
                        </div>

                        {/* Detailed metrics grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetricItem icon={TrendingUp} label="Impressions" value={metrics.impressions} color="text-purple-400" />
                            <MetricItem icon={BarChart2} label="Engagements" value={metrics.engagements} color="text-blue-400" />
                            <MetricItem icon={Info} label="Detail expands" value={metrics.detailExpands} color="text-orange-400" />
                            <MetricItem icon={Users} label="Profile visits" value={metrics.profileVisits} color="text-emerald-400" />
                        </div>

                        {/* Recent likers */}
                        {recentLikers.length > 0 && (
                            <div className="border-t border-border pt-3">
                                <p className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                                    <Heart className="w-3.5 h-3.5 text-pink-500" />
                                    Liked by
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {recentLikers.map(u => (
                                        <div key={u.id} className="flex items-center gap-1.5 text-sm">
                                            <Avatar className="w-6 h-6">
                                                <AvatarImage src={getMediaUrl(u.avatar)} />
                                                <AvatarFallback className="text-[10px]">{u.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-muted-foreground">@{u.handle}</span>
                                            {u.verified && <BadgeCheck className="w-3 h-3 text-blue-500" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
