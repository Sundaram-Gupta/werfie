import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/StatCard';
import { GettingStartedCard } from '@/components/shared/GettingStartedCard';
import { Users, FileText, Shield, AlertTriangle, Activity, Server, Database, ArrowRight, DollarSign, Mail, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [statsRes, activityRes] = await Promise.all([
                    api.get('/admin/dashboard/stats'),
                    api.get('/admin/dashboard/recent-activity')
                ]);

                if (statsRes.data.success) {
                    setStats(statsRes.data.data.stats);
                }
                if (activityRes.data.success) {
                    setActivities(activityRes.data.data);
                }
                setError(null);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setError("Failed to connect to the server. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-medium text-foreground">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-0 pb-8">



            {/* Stat Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers?.value || "0"}
                    icon={Users}
                    color="blue"
                    trend={stats?.totalUsers?.trend}
                    trendValue={stats?.totalUsers?.trendValue}
                />
                <StatCard
                    title="Daily Active Users"
                    value={stats?.dau?.value || "0"}
                    icon={Activity}
                    color="purple"
                    trend={stats?.dau?.trend}
                    trendValue={stats?.dau?.trendValue}
                />
                <StatCard
                    title="Verification Requests"
                    value={stats?.verifications?.value || "0"}
                    icon={Shield}
                    color="green"
                    trend={stats?.verifications?.trend}
                    trendValue={stats?.verifications?.trendValue}
                />
                <StatCard
                    title="Reports"
                    value={stats?.reports?.value || "0"}
                    icon={AlertTriangle}
                    color="red"
                    trend={stats?.reports?.trend}
                    trendValue={stats?.reports?.trendValue}
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

                            {activities.length === 0 ? (
                                <div className="text-center py-10">
                                    <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                                    <p className="text-sm text-muted-foreground">No recent activity found</p>
                                </div>
                            ) : (
                                activities.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 relative z-10 group">
                                        <div className={cn(
                                            "flex-shrink-0 h-9 w-9 rounded-full border-2 border-background ring-1 ring-border flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-110",
                                            item.color === 'blue' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                                            item.color === 'purple' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                            item.color === 'yellow' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                            item.color === 'green' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                            "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {item.type === "system" ? <Server className="h-4 w-4" /> : <Users className="h-4 w-4" />}
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
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                                            {item.type !== 'system' && (
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user}`} alt={item.user} className="h-6 w-6 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
