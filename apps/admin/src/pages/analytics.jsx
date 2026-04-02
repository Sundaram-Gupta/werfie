import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/axios';
import { RefreshCw, Activity, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

export default function AnalyticsPage() {
    const [engagementData, setEngagementData] = useState([]);
    const [interactionData, setInteractionData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [engRes, intRes] = await Promise.all([
                api.get('/admin/analytics/user-engagement'),
                api.get('/admin/analytics/post-interactions')
            ]);
            setEngagementData(engRes.data || []);
            setInteractionData(intRes.data || []);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Set up real-time polling every 30 seconds
        const timer = setInterval(fetchData, 30000);
        return () => clearInterval(timer);
    }, [fetchData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Weekly User Engagement
                        </CardTitle>
                        <CardDescription>Active vs New Users over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center font-bold text-muted-foreground animate-pulse">Loading charts...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={engagementData}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="active" name="Active Users" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="new" name="New Signups" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-emerald-500" />
                            Post Interactions
                        </CardTitle>
                        <CardDescription>Likes, Retweets, and Replies distribution (Last 7 days)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center font-bold text-muted-foreground animate-pulse">Loading charts...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={interactionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {interactionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="glass-card">
                 <CardHeader>
                     <CardTitle>Interactions Summary</CardTitle>
                 </CardHeader>
                 <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                           {interactionData.map((item, i) => (
                                <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                                     <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{item.name}</div>
                                     <div className="text-2xl font-black mt-1">{item.value.toLocaleString()}</div>
                                </div>
                           ))}
                      </div>
                 </CardContent>
            </Card>
        </div>
    );
}
