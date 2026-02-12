import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, PauseCircle, BarChart2, CheckCircle, XCircle, DollarSign, Users, Activity, TrendingUp, Loader2 } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

// Chart Data (Keeping mock for now as analytics aren't fully implemented)
const revenueData = [
    { name: 'Mon', revenue: 4500 },
    { name: 'Tue', revenue: 5200 },
    { name: 'Wed', revenue: 4800 },
    { name: 'Thu', revenue: 6100 },
    { name: 'Fri', revenue: 5500 },
    { name: 'Sat', revenue: 7200 },
    { name: 'Sun', revenue: 6800 },
];

const performanceData = [
    { name: 'Jan', impressions: 400000, clicks: 24000 },
    { name: 'Feb', impressions: 300000, clicks: 13980 },
    { name: 'Mar', impressions: 200000, clicks: 9800 },
    { name: 'Apr', impressions: 278000, clicks: 39080 },
    { name: 'May', impressions: 189000, clicks: 48000 },
    { name: 'Jun', impressions: 239000, clicks: 38000 },
];

export default function AdsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [adAccounts, setAdAccounts] = useState([]);
    const [creators, setCreators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revenueShare, setRevenueShare] = useState(20); // Percentage

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [campaignsRes, accountsRes, creatorsRes] = await Promise.all([
                    api.get('/admin/ads'),
                    api.get('/admin/business'),
                    api.get('/admin/monetization')
                ]);
                
                // Map API data to UI format
                setCampaigns(campaignsRes.data.map(c => ({
                    id: c.id,
                    name: c.name,
                    client: c.adAccount?.business?.companyName || 'Unknown',
                    status: c.status,
                    budget: `$${c.dailyBudget}`,
                    impressions: c.impressions,
                    clicks: c.clicks
                })));

                setAdAccounts(accountsRes.data.map(a => ({
                    id: a.id,
                    business: a.companyName,
                    type: a.industry,
                    status: a.status,
                    appliedDate: new Date(a.createdAt).toISOString().split('T')[0]
                })));

                setCreators(creatorsRes.data.map(cr => ({
                    id: cr.id,
                    name: cr.user?.profile?.name || 'Unknown',
                    handle: cr.user?.profile?.handle ? `@${cr.user.profile.handle}` : 'Unknown',
                    followers: '0', // Not yet implemented in backend
                    status: cr.status
                })));

            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // -- Campaign Actions --
    const toggleCampaignStatus = async (id) => {
        const campaign = campaigns.find(c => c.id === id);
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        try {
            await api.patch('/admin/ads', { id, status: newStatus });
            setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
        } catch (error) {
            console.error('Failed to update campaign status');
        }
    };

    // -- Ad Account Actions --
    const handleAccountAction = async (id, action) => {
        const newStatus = action === 'approve' ? 'active' : 'rejected';
        try {
            await api.patch('/admin/business', { id, status: newStatus });
            setAdAccounts(adAccounts.map(a => a.id === id ? { ...a, status: newStatus } : a));
        } catch (error) {
            console.error('Failed to update account status');
        }
    };

    // -- Creator Actions --
    const handleCreatorAction = async (id, action) => {
        const newStatus = action === 'approve' ? 'active' : 'rejected';
        try {
            await api.patch('/admin/monetization', { id, status: newStatus });
            setCreators(creators.map(c => c.id === id ? { ...c, status: newStatus } : c));
        } catch (error) {
            console.error('Failed to update creator status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ads & Monetization</h1>
                    <p className="text-muted-foreground">Manage global ad campaigns, revenue, and creator monetization.</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="accounts">Ad Accounts</TabsTrigger>
                    <TabsTrigger value="monetization">Monetization</TabsTrigger>
                </TabsList>

                {/* -- OVERVIEW TAB -- */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$225,000</div>
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Impressions</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">4.2M</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. click rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">2.4%</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-7">
                         <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue Over Time</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                             <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                                <CardDescription>Impressions vs Clicks</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={performanceData}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                         <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            cursor={{fill: 'hsl(var(--muted))'}}
                                        />
                                        <Bar dataKey="impressions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="clicks" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* -- CAMPAIGNS TAB -- */}
                <TabsContent value="campaigns">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Campaigns</CardTitle>
                            <CardDescription>Manage running advertisements across the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campaign Name</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Budget</TableHead>
                                        <TableHead>Impressions</TableHead>
                                        <TableHead>Clicks</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map((campaign) => (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">{campaign.name}</TableCell>
                                            <TableCell>{campaign.client}</TableCell>
                                            <TableCell>{campaign.budget}</TableCell>
                                            <TableCell>{campaign.impressions}</TableCell>
                                            <TableCell>{campaign.clicks}</TableCell>
                                            <TableCell>
                                                <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'paused' ? 'warning' : 'secondary'}>
                                                    {campaign.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {campaign.status !== 'completed' && (
                                                    <Button variant="ghost" size="sm" onClick={() => toggleCampaignStatus(campaign.id)}>
                                                        {campaign.status === 'active' ? (
                                                            <><PauseCircle className="h-4 w-4 mr-2" /> Suspend</>
                                                        ) : (
                                                            <><PlayCircle className="h-4 w-4 mr-2" /> Resume</>
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* -- AD ACCOUNTS TAB -- */}
                <TabsContent value="accounts">
                     <Card>
                        <CardHeader>
                            <CardTitle>Ad Account Requests</CardTitle>
                            <CardDescription>Review businesses applying for ad accounts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Business Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Applied Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {adAccounts.map((account) => (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">{account.business}</TableCell>
                                            <TableCell>{account.type}</TableCell>
                                            <TableCell>{account.appliedDate}</TableCell>
                                            <TableCell>
                                                <Badge variant={account.status === 'active' ? 'outline' : account.status === 'pending' ? 'secondary' : 'destructive'}>
                                                    {account.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {account.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAccountAction(account.id, 'approve')}>
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAccountAction(account.id, 'reject')}>
                                                            <XCircle className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                {account.status === 'active' && (
                                                     <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                                                        Suspend Account
                                                     </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* -- MONETIZATION TAB -- */}
                <TabsContent value="monetization" className="space-y-6">
                    {/* Settings Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Global Revenue Settings</CardTitle>
                                <CardDescription>Control revenue split and eligibility.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Platform Revenue Share (%)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            type="number" 
                                            value={revenueShare} 
                                            onChange={(e) => setRevenueShare(e.target.value)}
                                            className="w-24"
                                            min="0"
                                            max="100"
                                        />
                                        <span className="text-sm text-muted-foreground">Creator keeps {100 - revenueShare}%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">The percentage of ad revenue retained by the platform.</p>
                                </div>
                                <div className="space-y-4 pt-4 border-t">
                                    <Label>Eligibility Controls</Label>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="verification-required" className="font-normal cursor-pointer">Require Verification Badge</Label>
                                        <Switch id="verification-required" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="min-followers" className="font-normal cursor-pointer">Min. 10k Followers</Label>
                                        <Switch id="min-followers" defaultChecked />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader>
                                <CardTitle>Monetization Status</CardTitle>
                                <CardDescription>System-wide monetization health.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <p className="font-medium">Total Monetized Creators</p>
                                        <p className="text-2xl font-bold">1,248</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-500 opacity-80" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Pending Applications</p>
                                        <p className="text-2xl font-bold">{creators.filter(c => c.status === 'pending').length}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-amber-500 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Creator Approval List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Applications</CardTitle>
                            <CardDescription>Review creators applying for monetization programs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Creator</TableHead>
                                        <TableHead>Followers</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {creators.map((creator) => (
                                        <TableRow key={creator.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <span className="block">{creator.name}</span>
                                                    <span className="text-xs text-muted-foreground">{creator.handle}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{creator.followers}</TableCell>
                                            <TableCell>
                                                <Badge variant={creator.status === 'active' ? 'outline' : creator.status === 'pending' ? 'secondary' : 'destructive'}>
                                                    {creator.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {creator.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleCreatorAction(creator.id, 'approve')}>
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleCreatorAction(creator.id, 'reject')}>
                                                            <XCircle className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                                 {creator.status === 'active' && (
                                                     <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                                                        Revoke Access
                                                     </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
