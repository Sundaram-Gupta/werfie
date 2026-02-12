import { DollarSign, Users, CreditCard, TrendingUp, ArrowUpRight, Lock, Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

function MetricCard({ title, value, change, icon: Icon }) {
    return (
        <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 hover:border-border transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-muted-foreground group-hover:bg-green-500/10 group-hover:text-green-500 transition-colors">
                    {Icon && <Icon className="w-4 h-4" />}
                </div>
                <Badge variant="outline" className="bg-transparent border-0 text-green-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {change}
                </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-1">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}

export default function MonetizationOverview() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Monetization Overview</h2>
                <p className="text-sm text-muted-foreground">Track your earnings and manage revenue streams</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total Revenue" value="$4,280.00" change="12.5%" icon={DollarSign} />
                <MetricCard title="Active Subscribers" value="142" change="5.2%" icon={Users} />
                <MetricCard title="Tips Received" value="$350.00" change="8.1%" icon={Gift} />
                <MetricCard title="Pending Payout" value="$850.00" change="Ready" icon={CreditCard} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Chart Placeholder */}
                <div className="md:col-span-2 bg-zinc-900/50 border border-border/50 rounded-xl p-6 min-h-[300px] flex flex-col justify-center items-center text-muted-foreground relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent pointer-events-none" />
                    <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-medium">Revenue Growth (Last 6 Months)</p>
                    <p className="text-xs opacity-50">Chart visualization coming soon</p>
                </div>

                {/* Feature Status */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 space-y-6">
                    <h3 className="font-bold">Active Features</h3>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                <Lock className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">Subscriptions</div>
                                <div className="text-[10px] text-muted-foreground">Earn monthly</div>
                            </div>
                        </div>
                        <Switch checked={true} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                                <Gift className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">Tips</div>
                                <div className="text-[10px] text-muted-foreground">One-time support</div>
                            </div>
                        </div>
                        <Switch checked={true} />
                    </div>

                    <div className="flex items-center justify-between opacity-50">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="font-medium text-sm">Ads Revenue</div>
                                <div className="text-[10px] text-muted-foreground">Not eligible yet</div>
                            </div>
                        </div>
                        <Switch disabled />
                    </div>
                </div>
            </div>
        </div>
    )
}
