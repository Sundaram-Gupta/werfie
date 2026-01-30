import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { GettingStartedCard } from '@/components/shared/GettingStartedCard';
import { Users, FileText, Shield, AlertTriangle, Activity, Server, Database, ArrowRight, DollarSign, Mail, MessageSquare, Zap } from 'lucide-react';
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



            {/* Stat Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value="12.5M"
                    icon={Users}
                    color="blue"
                    trend="up"
                    trendValue="+120K"
                />
                <StatCard
                    title="Daily Active Users"
                    value="8.2M"
                    icon={Activity}
                    color="purple"
                    trend="up"
                    trendValue="+5.4%"
                />
                <StatCard
                    title="Verification Requests"
                    value="842"
                    icon={Shield}
                    color="green"
                    trend="up"
                    trendValue="+12"
                />
                <StatCard
                    title="Reports"
                    value="156"
                    icon={AlertTriangle}
                    color="red"
                    trend="down"
                    trendValue="-3%"
                />
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Getting Started Checklist - Takes up 1 column */}
                <div className="lg:col-span-1 h-full">
                    <GettingStartedCard className="h-full" />
                </div>

                {/* Recent Activity Feed - Takes up 2 columns */}
                <Card className="lg:col-span-2 bg-card border-border shadow-sm h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Recent Activity
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            View all <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-6 relative pl-2">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-2 bottom-6 w-[2px] bg-border/60" />

                            {[
                                { user: "Sarah Miller", action: "verified account @elonmusk", time: "16m ago", color: "blue" },
                                { user: "Mike Chen", action: "reviewed report #12345", time: "45m ago", color: "purple" },
                                { user: "System", action: "flagged suspicious activity", time: "2h ago", color: "yellow" },
                                { user: "Emily Davis", action: "banned bot network", time: "3h ago", color: "red" },
                                { user: "John Doe", action: "approved ad campaign", time: "5h ago", color: "green" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 relative z-10 group">
                                    <div className={cn(
                                        "flex-shrink-0 h-9 w-9 rounded-full border-2 border-background ring-1 ring-border flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-110",
                                        item.color === 'blue' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                        item.color === 'purple' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                        item.color === 'yellow' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                        item.color === 'green' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                        "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                    )}>
                                        {item.user === "System" ? <Server className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-foreground">{item.user}</span> {item.action}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-border inline-block"></span>
                                            {item.time}
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user}`} alt={item.user} className="h-6 w-6 rounded-full" />
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
