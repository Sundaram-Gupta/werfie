import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { analyticsService, postService, userService } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Activity,
    BarChart,
    Calendar,
    ChevronRight,
    DollarSign,
    Heart,
    MessageCircle,
    Repeat,
    Settings,
    TrendingUp,
    Users,
    Video,
    Loader2
} from "lucide-react"

function formatCount(n) {
    const num = Number(n)
    if (isNaN(num)) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return String(num)
}

function formatGrowth(growth) {
    const n = Number(growth)
    if (isNaN(n) || n === 0) return '+0'
    const sign = n > 0 ? '+' : ''
    return `${sign}${n}`
}

function formatEarnings(total) {
    const n = Number(total)
    if (isNaN(n)) return '$0.00'
    return '$' + n.toFixed(2)
}

export default function CreatorStudio() {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalPosts: { total: 0, growth: 0 },
        followers: { total: 0, growth: 0 },
        views: { total: 0, growth: 0 },
        engagement: { rate: 0, growth: 0 },
        earnings: { total: 0, growth: 0 }
    })
    const [recentPosts, setRecentPosts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            const fallbackStats = async (uid) => {
                try {
                    const [postCount, followersCount] = await Promise.all([
                        postService.getPostCount().catch(() => 0),
                        userService.getFollowersCount(uid).catch(() => 0)
                    ])
                    return {
                        totalPosts: { total: Number(postCount) || 0, growth: 0 },
                        followers: { total: Number(followersCount) || 0, growth: 0 },
                        views: { total: 0, growth: 0 },
                        engagement: { rate: 0, growth: 0 },
                        earnings: { total: 0, growth: 0 }
                    }
                } catch {
                    return null
                }
            }

            try {
                const [apiStats, fbStats] = await Promise.all([
                    analyticsService.getCreatorStats().catch(() => null),
                    user?.id ? fallbackStats(user.id) : Promise.resolve(null)
                ])
                const preferApiOrFallback = (apiVal, fbVal) => {
                    const apiNum = apiVal?.total ?? apiVal?.rate
                    if (apiNum !== undefined && apiNum !== null && Number(apiNum) > 0) return apiVal
                    return fbVal ?? { total: 0, growth: 0 }
                }
                setStats(prev => ({
                    ...prev,
                    totalPosts: preferApiOrFallback(apiStats?.totalPosts, fbStats?.totalPosts) ?? prev.totalPosts,
                    followers: preferApiOrFallback(apiStats?.followers, fbStats?.followers) ?? prev.followers,
                    views: apiStats?.views ?? prev.views,
                    engagement: apiStats?.engagement ?? prev.engagement,
                    earnings: apiStats?.earnings ?? prev.earnings
                }))
            } catch (error) {
                console.error("Failed to fetch creator stats:", error)
                if (user?.id) {
                    const fb = await fallbackStats(user.id)
                    if (fb) setStats(fb)
                }
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [user?.id])

    useEffect(() => {
        if (!user?.id) return
        const fetchRecentPosts = async () => {
            try {
                const { posts } = await postService.getPosts({ userId: user.id }) || {}
                setRecentPosts(Array.isArray(posts) ? posts.slice(0, 5) : [])
            } catch (error) {
                console.error("Failed to fetch recent posts:", error)
            }
        }
        fetchRecentPosts()
    }, [user?.id])

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
    }

    return (
        <div className="pb-28">
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Creator Studio</h1>
                    <p className="text-sm text-muted-foreground">Manage and grow your content</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full border-[rgb(83,100,113)] hover:bg-white/[0.03]" asChild>
                    <Link to="/settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Link>
                </Button>
            </div>

            <div className="p-4 flex flex-col gap-6">
                {/* Section A: Overview Metrics - format raw values on client */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard title="Total Posts" value={formatCount(stats.totalPosts?.total ?? 0)} change={`${formatGrowth(stats.totalPosts?.growth ?? 0)} this week`} icon={<Activity className="text-blue-500" />} />
                    <MetricCard title="Followers" value={formatCount(stats.followers?.total ?? 0)} change={`${formatGrowth(stats.followers?.growth ?? 0)} vs last month`} icon={<Users className="text-green-500" />} />
                    <MetricCard title="Engagement" value={String(stats.engagement?.rate ?? 0).replace(/%/g, '') + '%'} change={`${formatGrowth(stats.engagement?.growth ?? 0)}% vs last month`} icon={<TrendingUp className="text-purple-500" />} />
                    <MetricCard title="Impressions" value={formatCount(stats.views?.total ?? 0)} change={`${formatGrowth(stats.views?.growth ?? 0)} vs last month`} icon={<BarChart className="text-orange-500" />} />
                </div>

                {/* Section B: Tools */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToolCard to="/analytics" title="Analytics" description="Deep dive into your account performance and audience growth." icon={<BarChart className="w-6 h-6 text-blue-500" />} />
                    <ToolCard to="/media/library" title="Media Studio" description="Manage your uploaded images, videos and GIFs in one library." icon={<Video className="w-6 h-6 text-purple-500" />} />
                    <ToolCard to="/scheduled-posts" title="Scheduled Posts" description="View and manage content scheduled for the future." icon={<Calendar className="w-6 h-6 text-orange-500" />} />
                    <ToolCard to="/audience-insights" title="Audience Insights" description="Understand who your followers are and what they like." icon={<Users className="w-6 h-6 text-green-500" />} />
                </div>

                {/* Section C: Recent Post Performance */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Recent Post Performance</h2>
                    <div className="border border-border rounded-xl bg-black overflow-hidden">
                        {recentPosts.length > 0 ? recentPosts.map((post) => {
                            const c = post._count || {}
                            const media = post.media?.[0]
                            const typeLabel = media?.mediaType === 'video' ? 'Video' : (media ? 'Image' : 'Post')
                            const timeAgo = post.createdAt ? (() => {
                                const d = new Date(post.createdAt)
                                const now = new Date()
                                const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
                                if (diff === 0) return 'Today'
                                if (diff === 1) return 'Yesterday'
                                if (diff < 7) return `${diff} days ago`
                                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            })() : ''
                            return (
                                <Link to={`/post/${post.id}`} key={post.id} className="flex gap-4 p-4 border-b border-border last:border-0 hover:bg-white/[0.05] transition-colors cursor-pointer group">
                                    <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
                                        {media?.mediaUrl ? (
                                            <img src={media.mediaUrl.startsWith('http') ? media.mediaUrl : ((import.meta.env.VITE_API_URL || '') + (media.mediaUrl.startsWith('/') ? '' : '/') + media.mediaUrl)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">{typeLabel}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <p className="font-medium text-sm line-clamp-2 text-white/90 group-hover:text-blue-400 transition-colors">
                                                {post.content || '(No content)'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">Posted {timeAgo}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            <MetricItem icon={<Heart className="w-3.5 h-3.5" />} value={formatCount(c.likes ?? 0)} label="Likes" />
                                            <MetricItem icon={<MessageCircle className="w-3.5 h-3.5" />} value={formatCount(c.replies ?? 0)} label="Replies" />
                                            <MetricItem icon={<Repeat className="w-3.5 h-3.5" />} value={formatCount(c.retweets ?? 0)} label="Reposts" />
                                            <MetricItem icon={<BarChart className="w-3.5 h-3.5" />} value={formatCount((c.likes ?? 0) + (c.replies ?? 0) + (c.retweets ?? 0) || 0)} label="Engagements" />
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-blue-400 transition-colors" />
                                </Link>
                            )
                        }) : (
                            <div className="p-8 text-center text-muted-foreground">
                                <p className="text-sm">No posts yet. Create your first post to see performance here.</p>
                                <Link to="/">
                                    <Button variant="outline" size="sm" className="mt-3 rounded-full">Create Post</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section D: Monetization - at bottom of page */}
                <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-500/20 border relative overflow-hidden group hover:border-green-500/40 transition-all duration-300 rounded-lg max-w-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative z-10 px-5 pt-5 pb-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-500/20 rounded-xl border border-green-500/20 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Monetization</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-0.5">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 text-green-400 font-semibold text-[10px] uppercase tracking-wider rounded-full border border-green-500/30">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Active
                                    </span>
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 px-5 pb-5 pt-3">
                        <div className="space-y-1">
                            <div className="text-4xl font-black bg-gradient-to-r from-green-300 via-green-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                                {formatEarnings(stats.earnings?.total ?? 0)}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span>Available Balance</span>
                                <span className="text-green-400 font-bold">+{formatEarnings(stats.earnings?.growth ?? 0)}</span>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold h-10 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                View Payouts
                            </Button>
                            <Button variant="ghost" className="w-full rounded-xl text-sm font-semibold hover:bg-white/5 transition-colors text-muted-foreground hover:text-white h-9">
                                Subscription Settings
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function MetricCard({ title, value, change, icon }) {
    return (
        <Card className="bg-black border-border border hover:border-white/20 transition-all duration-300 group hover:shadow-lg hover:shadow-white/5 hover:-translate-y-0.5">
            <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground font-medium group-hover:text-white/80 transition-colors">{title}</span>
                    <div className="p-1.5 bg-white/[0.05] rounded-lg group-hover:bg-white/[0.1] transition-colors">
                        {icon}
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-bold group-hover:scale-105 transition-transform origin-left">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1.5">{change}</div>
                </div>
            </CardContent>
        </Card>
    )
}

function MetricItem({ icon, value, label }) {
    return (
        <div className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors">
            {icon}
            <span className="text-sm font-medium text-white">{value}</span>
            <span className="text-xs hidden sm:inline">{label}</span>
        </div>
    )
}

function ToolCard({ title, description, icon, to }) {
    const CardContentWrapper = (
        <CardContent className="p-6 h-full flex flex-col relative z-10">
            <div className="mb-5 p-3 bg-white/[0.03] w-fit rounded-2xl border border-white/5 group-hover:bg-white/[0.08] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:border-white/10">
                {icon}
            </div>
            <h3 className="font-bold mb-2 text-lg text-white group-hover:text-blue-400 transition-colors">{title}</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed flex-1 group-hover:text-white/80 transition-colors italic font-medium">{description}</p>
            <div className="mt-5 flex items-center text-xs font-bold uppercase tracking-widest text-blue-400/80 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                <span>Explore Tool</span>
                <ChevronRight className="w-4 h-4 ml-1" />
            </div>
        </CardContent>
    )

    const CardBase = (
        <Card className="bg-zinc-950/50 backdrop-blur-xl border-white/[0.03] hover:border-blue-500/30 transition-all cursor-pointer border group h-full hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 duration-500 relative overflow-hidden">
            {/* Subtle Inner Glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {CardContentWrapper}
        </Card>
    )

    if (to) {
        return (
            <Link to={to} className="block h-full">
                {CardBase}
            </Link>
        )
    }

    return CardBase
}
