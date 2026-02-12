import { BarChart2, TrendingUp, Users, MousePointer2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

export default function BusinessDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Overview</h2>
                <p className="text-sm text-muted-foreground">Detailed analytics for the last 30 days</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total Followers" value="12,450" change="12.5%" trend="up" icon={Users} />
                <MetricCard title="Impressions" value="45.2K" change="8.1%" trend="up" icon={TrendingUp} />
                <MetricCard title="Engagement Rate" value="4.8%" change="2.1%" trend="down" icon={MousePointer2} />
                <MetricCard title="Profile Visits" value="3,120" change="5.4%" trend="up" icon={BarChart2} />
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

            {/* Recent Activity / Top Posts */}
            <div>
                <h3 className="font-bold mb-4">Top Performing Posts</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                                    IMG
                                </div>
                                <div>
                                    <div className="font-medium">New Feature Announcement</div>
                                    <div className="text-sm text-muted-foreground">Posted 2 days ago</div>
                                </div>
                            </div>
                            <div className="flex gap-6 text-sm">
                                <div>
                                    <div className="font-bold">2.4K</div>
                                    <div className="text-muted-foreground text-xs">Reach</div>
                                </div>
                                <div>
                                    <div className="font-bold">145</div>
                                    <div className="text-muted-foreground text-xs">Engage</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
