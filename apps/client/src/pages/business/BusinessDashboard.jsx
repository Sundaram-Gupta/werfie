import { useState, useEffect } from "react"
import { BarChart2, TrendingUp, Users, MousePointer2, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { businessService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"

function MetricCard({ title, value, change, trend = "up", icon: Icon }) {
    const isPositive = trend === "up"
    return (
        <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 hover:border-border transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {Icon && <Icon className="w-4 h-4" />}
                </div>
                <Badge variant="outline" className={`bg-transparent border-0 ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-1">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}

function formatTimeAgo(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const mins = Math.floor(diffMs / (60 * 1000))
    if (days >= 1) return `Posted ${days} day${days === 1 ? '' : 's'} ago`
    if (hours >= 1) return `Posted ${hours} hour${hours === 1 ? '' : 's'} ago`
    if (mins >= 1) return `Posted ${mins} min${mins === 1 ? '' : 's'} ago`
    return "Just posted"
}

export default function BusinessDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await businessService.getStats()
                setStats(data)
            } catch (err) {
                console.error("Failed to fetch business stats:", err)
                setError("Failed to load dashboard data")
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold">Overview</h2>
                    <p className="text-sm text-muted-foreground">Detailed analytics for the last 30 days</p>
                </div>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    if (error || !stats) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold">Overview</h2>
                    <p className="text-sm text-muted-foreground">{error || "No data available"}</p>
                </div>
            </div>
        )
    }

    const topPosts = stats.topPosts || []

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Overview</h2>
                <p className="text-sm text-muted-foreground">Detailed analytics for the last 30 days</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Followers"
                    value={stats.followers ?? "0"}
                    change={`${stats.followersGrowth ?? "0"}%`}
                    trend="up"
                    icon={Users}
                />
                <MetricCard
                    title="Impressions"
                    value={stats.impressions ?? "0"}
                    change={`${stats.impressionsGrowth ?? "0"}%`}
                    trend="up"
                    icon={TrendingUp}
                />
                <MetricCard
                    title="Engagement Rate"
                    value={`${stats.engagementRate ?? "0"}%`}
                    change={stats.engagementRate ? "Current" : "—"}
                    trend={stats.engagementTrend ?? "up"}
                    icon={MousePointer2}
                />
                <MetricCard
                    title="Profile Visits"
                    value={stats.profileVisits ?? "0"}
                    change={`${stats.profileVisitsGrowth ?? "0"}%`}
                    trend="up"
                    icon={BarChart2}
                />
            </div>

            {/* Charts Section Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 h-80 flex flex-col justify-center items-center text-muted-foreground">
                    <BarChart2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>Follower Growth Chart (Coming Soon)</p>
                </div>
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 h-80 flex flex-col justify-center items-center text-muted-foreground">
                    <MousePointer2 className="w-12 h-12 mb-4 opacity-20" />
                    <p>Engagement Distribution (Coming Soon)</p>
                </div>
            </div>

            {/* Top Performing Posts */}
            <div>
                <h3 className="font-bold mb-4">Top Performing Posts</h3>
                <div className="space-y-3">
                    {topPosts.length > 0 ? (
                        topPosts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {post.mediaUrl ? (
                                            <img
                                                src={getMediaUrl(post.mediaUrl)}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">TXT</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">
                                            {post.content?.slice(0, 50) || "Post"}
                                            {(post.content?.length || 0) > 50 ? "…" : ""}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {formatTimeAgo(post.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-6 text-sm flex-shrink-0 ml-4">
                                    <div>
                                        <div className="font-bold">{formatCount(post.reach ?? 0)}</div>
                                        <div className="text-muted-foreground text-xs">Reach</div>
                                    </div>
                                    <div>
                                        <div className="font-bold">{formatCount(post.engagement ?? 0)}</div>
                                        <div className="text-muted-foreground text-xs">Engage</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-8 text-center text-muted-foreground">
                            No posts yet. Create posts to see your top performers here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function formatCount(n) {
    const num = Number(n)
    if (isNaN(num)) return "0"
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return String(Math.round(num))
}
