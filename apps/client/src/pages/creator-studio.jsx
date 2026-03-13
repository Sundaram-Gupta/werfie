import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { analyticsService } from "@/services/api"
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

export default function CreatorStudio() {
    // State
    const [stats, setStats] = useState({
        followers: { total: "0", growth: "+0" },
        views: { total: "0", growth: "+0%" },
        engagement: { rate: "0%", growth: "+0%" },
        earnings: { total: "$0.00", growth: "+$0.00" }
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsService.getCreatorStats()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch creator stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

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
                <Button variant="outline" size="sm" className="rounded-full border-[rgb(83,100,113)] hover:bg-white/[0.03]">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Button>
            </div>

            <div className="p-4 flex flex-col gap-6">
                {/* Section A: Overview Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard title="Total Posts" value="248" change="+12 this week" icon={<Activity className="text-blue-500" />} />
                    <MetricCard title="Followers" value={stats.followers.total} change={`${stats.followers.growth} vs last month`} icon={<Users className="text-green-500" />} />
                    <MetricCard title="Engagement" value={stats.engagement.rate} change={`${stats.engagement.growth} vs last month`} icon={<TrendingUp className="text-purple-500" />} />
                    <MetricCard title="Impressions" value={stats.views.total} change={`${stats.views.growth} vs last month`} icon={<BarChart className="text-orange-500" />} />
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
                        {[1, 2, 3].map((i) => (
                            <Link to={`/post/${i}`} key={i} className="flex gap-4 p-4 border-b border-border last:border-0 hover:bg-white/[0.05] transition-colors cursor-pointer group">
                                <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
                                    {/* Placeholder image representation */}
                                    {i === 1 && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Image</div>}
                                    {i === 2 && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Video</div>}
                                    {i === 3 && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Link</div>}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <p className="font-medium text-sm line-clamp-2 text-white/90 group-hover:text-blue-400 transition-colors">
                                            {i === 1 ? "Just launched the new feature! Check it out here: link.com #coding #webdev" :
                                                i === 2 ? "Here is a quick tutorial on how to use React Server Components. ⚛️" :
                                                    "Why I switched from VS Code to Zed (and why you might want to too)."}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Posted {i * 2} days ago</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                        <MetricItem icon={<Heart className="w-3.5 h-3.5" />} value="1.2K" label="Likes" />
                                        <MetricItem icon={<MessageCircle className="w-3.5 h-3.5" />} value="84" label="Replies" />
                                        <MetricItem icon={<Repeat className="w-3.5 h-3.5" />} value="240" label="Reposts" />
                                        <MetricItem icon={<BarChart className="w-3.5 h-3.5" />} value="45K" label="Views" />
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground self-center group-hover:text-blue-400 transition-colors" />
                            </Link>
                        ))}
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
                                {stats.earnings.total}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span>Available Balance</span>
                                <span className="text-green-400 font-bold">{stats.earnings.growth}</span>
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
