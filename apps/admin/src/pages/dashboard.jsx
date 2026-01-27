import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { GettingStartedCard } from '@/components/shared/GettingStartedCard';
import { Users, FileText, Shield, AlertTriangle, Activity, Server, Database, ArrowRight, DollarSign, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Mock loading delay
                await new Promise(resolve => setTimeout(resolve, 800));
                setLoading(false);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-0 pb-8">

            {/* Dark Premium Banner (Reference Match) */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0b] border border-white/5 p-8 md:p-10 shadow-2xl group">
                {/* Subtle radial glow */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center backdrop-blur-sm">
                                {/* User Avatar */}
                                <div className="h-14 w-14 rounded-full bg-black flex items-center justify-center overflow-hidden relative border border-white/10">
                                    <img src="https://github.com/shadcn.png" alt="Admin" className="h-full w-full object-cover" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-[3px] border-[#0a0a0b] rounded-full"></div>
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back, Admin!</h1>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-400 text-sm">Werfie Admin Console</span>
                                <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold border border-yellow-500/20 uppercase tracking-wider flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Super Admin
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-xs font-medium text-gray-500">
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                    <Users className="h-3 w-3 text-blue-400" />
                                    <span className="text-gray-300">12.5M</span> users
                                </span>
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                                    <Activity className="h-3 w-3 text-purple-400" />
                                    <span className="text-gray-300">98.2%</span> uptime
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 py-5 shadow-lg shadow-blue-600/20 font-medium transition-all hover:scale-105 active:scale-95">
                            <Link to="/reports">
                                View Reports
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stat Cards (Social Media Context) */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value="12.5M"
                    icon={Users}
                    trend="up"
                    trendValue="+120K"
                    className="bg-[#151516]"
                />
                <StatCard
                    title="Daily Active Users"
                    value="8.2M"
                    icon={Activity}
                    trend="up"
                    trendValue="+5.4%"
                    className="bg-[#151516]"
                />
                <StatCard
                    title="Verification Requests"
                    value="842"
                    icon={Shield}
                    trend="up"
                    trendValue="+12"
                    className="bg-[#151516]"
                />
                <StatCard
                    title="New Reports"
                    value="156"
                    icon={AlertTriangle}
                    trend="down"
                    trendValue="-3%"
                    className="bg-[#151516]"
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Getting Started Checklist */}
                <GettingStartedCard />

                {/* Recent Activity Feed */}
                <Card className="bg-[#151516] border-white/5 shadow-none h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Recent Activity
                        </CardTitle>
                        <Button variant="link" className="text-gray-400 text-xs h-auto p-0 hover:text-white">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 relative pl-2 pt-2">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-white/5" />

                            {[
                                { user: "Sarah Miller", action: "verified account @elonmusk", time: "16m ago", color: "blue" },
                                { user: "Mike Chen", action: "reviewed report #12345", time: "45m ago", color: "purple" },
                                { user: "System", action: "flagged suspicious activity", time: "2h ago", color: "yellow" },
                                { user: "Emily Davis", action: "banned bot network", time: "3h ago", color: "red" },
                                { user: "John Doe", action: "approved ad campaign", time: "5h ago", color: "purple" },
                                { user: "Chris Wilson", action: "updated platform policies", time: "1d ago", color: "blue" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 relative z-10">
                                    <div className={cn(
                                        "flex-shrink-0 h-9 w-9 rounded-full border border-[#0a0a0b] ring-2 ring-[#151516] flex items-center justify-center font-bold text-xs",
                                        item.color === 'blue' ? "bg-blue-600/20 text-blue-500" :
                                            item.color === 'purple' ? "bg-purple-600/20 text-purple-500" :
                                                item.color === 'yellow' ? "bg-yellow-600/20 text-yellow-500" :
                                                    "bg-red-600/20 text-red-500"
                                    )}>
                                        {item.user === "System" ? <Server className="h-4 w-4" /> :
                                            <Users className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <p className="text-sm text-gray-400">
                                            <span className="font-semibold text-white">{item.user}</span> {item.action}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5 font-medium">{item.time}</p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user}`} alt={item.user} className="h-5 w-5 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
