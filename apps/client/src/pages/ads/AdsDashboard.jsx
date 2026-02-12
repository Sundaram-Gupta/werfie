import { BarChart3, TrendingUp, MousePointer2, DollarSign, ArrowUpRight, ArrowDownRight, Users, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

function MetricCard({ title, value, change, trend = "up", icon: Icon }) {
    const isPositive = trend === "up"
    return (
        <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 hover:border-border transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
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

export default function AdsDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Ads Overview</h2>
                <p className="text-sm text-muted-foreground">Performance for the last 30 days</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total Spend" value="$1,245.50" change="10.2%" trend="up" icon={DollarSign} />
                <MetricCard title="Impressions" value="482.1K" change="15.8%" trend="up" icon={Users} />
                <MetricCard title="Clicks (CTR)" value="12,405" change="2.5%" trend="up" icon={MousePointer2} />
                <MetricCard title="Avg. CPC" value="$0.10" change="-5.4%" trend="down" icon={Activity} />
            </div>

            {/* Charts Section Placeholder */}
            <div className="grid grid-cols-1 gap-4">
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 h-80 flex flex-col justify-center items-center text-muted-foreground relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                    <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Performance Chart (Spend vs Results)</p>
                    <p className="text-xs opacity-50">Visualizations coming soon</p>
                </div>
            </div>

            {/* Active Campaigns Teaser */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Active Campaigns</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-12 rounded-full ${i === 1 ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <div>
                                    <div className="font-medium">Spring Collection Promo {i}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] h-5 px-1 border-green-500/30 text-green-500">Active</Badge>
                                        <span>• Ends in 5 days</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">$125.00</div>
                                <div className="text-muted-foreground text-xs">Spent today</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
