import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'Mon', active: 4000, new: 2400 },
    { name: 'Tue', active: 3000, new: 1398 },
    { name: 'Wed', active: 2000, new: 9800 },
    { name: 'Thu', active: 2780, new: 3908 },
    { name: 'Fri', active: 1890, new: 4800 },
    { name: 'Sat', active: 2390, new: 3800 },
    { name: 'Sun', active: 3490, new: 4300 },
];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Weekly User Engagement</CardTitle>
                        <CardDescription>Active vs New Users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="active" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="new" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Post Interactions</CardTitle>
                        <CardDescription>Likes, Retweets, Replies</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <div className="text-muted-foreground">More analytics charts coming soon...</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
