import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, TrendingUp, Download, Eye, Globe, Zap, Radio, Bell } from 'lucide-react';
import { getDashboardMetrics, getMarketSignals, exportToCSV, exportToJSON } from '../services/enterprise.api';
import AlertRuleBuilder from '../components/enterprise/AlertRuleBuilder';
import { getUserServiceUrl } from '@/lib/api';
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

// Extract the hostname/port
const getWsUrl = () => {
  const origin = getUserServiceUrl() || window.location.origin;
  return origin.replace(/^http(s?):\/\//, 'ws$1://') + '/ws/enterprise-signals';
};

const COLORS = ['#0ea5e9', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function EnterpriseDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'rules', 'charts'
    const [wsStatus, setWsStatus] = useState('Connecting...');

    const wsRef = useRef(null);

    useEffect(() => {
        fetchData();
        setupWebSocket();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const setupWebSocket = () => {
        const wsUrl = getWsUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsStatus('Connected');
            console.log('WS Connected to Enterprise Signals');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWsEvent(data);
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        ws.onclose = () => {
            setWsStatus('Disconnected');
            console.log('WS Disconnected. Reconnecting in 5s...');
            setTimeout(setupWebSocket, 5000);
        };

        ws.onerror = (err) => {
            console.error('WS Error', err);
        };
    };

    const handleWsEvent = (msg) => {
        const { type, payload } = msg;
        if (type === 'NEW_SIGNAL') {
            setSignals(prev => [payload, ...prev].slice(0, 100)); // Prepend and keep 100 max
            // Only update counts roughly to keep UI alive without fetching
            setMetrics(prev => prev ? ({ ...prev, highImpactToday: payload.impact_score >= 80 ? prev.highImpactToday + 1 : prev.highImpactToday }) : null);
        } else if (type === 'HIGH_IMPACT') {
            toast.error(`High Impact Signal Detected! Region: ${payload.region}, Score: ${payload.impact_score}`, {
                icon: <AlertTriangle className="text-red-500 w-5 h-5"/>,
                duration: 5000
            });
        } else if (type === 'ALERT_TRIGGERED') {
            toast.success(`Alert Rule Triggered (Method: ${payload.delivery_method}) for Signal ${payload.signal_id}`, {
                icon: <Bell className="text-amber-500 w-5 h-5"/>,
            });
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [metricsData, signalsData] = await Promise.all([
                getDashboardMetrics(),
                getMarketSignals()
            ]);
            setMetrics(metricsData);
            setSignals(signalsData);
        } catch (error) {
            console.error("Failed to load enterprise data", error);
            toast.error("Failed to load initial data");
        } finally {
            setLoading(false);
        }
    };

    // Calculate chart data based on signals (Client-side mock aggregation for visualization)
    const categoryData = React.useMemo(() => {
        const counts = signals.reduce((acc, s) => {
            const c = s.category || 'General';
            acc[c] = (acc[c] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [signals]);

    const timeSeriesData = React.useMemo(() => {
        // Mock grouping by hour for visualization
        const hours = [...signals].reverse().reduce((acc, s) => {
            const d = new Date(s.createdAt || s.timestamp);
            const hour = `${d.getHours()}:00`;
            if (!acc[hour]) acc[hour] = { time: hour, avgImpact: 0, count: 0 };
            acc[hour].avgImpact += (s.impactScore || s.impact_score || 0);
            acc[hour].count += 1;
            return acc;
        }, {});
        return Object.values(hours).map(h => ({ time: h.time, "Avg Impact": Math.round(h.avgImpact/h.count) }));
    }, [signals]);

    const getImpactColor = (score) => {
        if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    };

    return (
        <div className="flex-1 w-full min-h-screen border-x border-border/50 bg-background pb-20 sm:pb-0 animate-in fade-in duration-500">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        Enterprise Intelligence
                        <Badge variant="outline" className={`ml-2 ${wsStatus === 'Connected' ? 'border-primary text-primary' : 'border-amber-500 text-amber-500'}`}>
                            {wsStatus === 'Connected' ? <Radio className="w-3 h-3 mr-1 animate-pulse" /> : null}
                            {wsStatus}
                        </Badge>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">Real-time market signals extracted from verified global institutional announcements.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="flex-1 sm:flex-none glass-button">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToJSON} className="flex-1 sm:flex-none glass-button">
                        <Download className="w-4 h-4 mr-2" /> Export JSON
                    </Button>
                </div>
            </header>

            <div className="p-6 space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="glass-panel hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">High Impact Signals Today</CardTitle>
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tighter">
                                {metrics?.highImpactToday || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Average Severity</CardTitle>
                            <TrendingUp className="w-4 h-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tighter">
                                {Number(metrics?.avgSeverity || 0).toFixed(1)} <span className="text-lg text-muted-foreground font-medium">/ 5.0</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Top Regions</CardTitle>
                            <Globe className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold truncate">
                                {metrics?.topRegions?.length > 0 ? metrics.topRegions.map(r => r.name).slice(0, 2).join(', ') : 'Global'}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-panel hover:shadow-lg transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
                            <Eye className="w-4 h-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black tracking-tighter">{metrics?.activeAlerts || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button 
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200 ${activeTab === 'feed' ? 'border-primary text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))] bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('feed')}
                    >
                        Terminal Feed
                    </button>
                    <button 
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200 ${activeTab === 'charts' ? 'border-primary text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))] bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('charts')}
                    >
                        Analytics &amp; Charts
                    </button>
                    <button 
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-all duration-200 ${activeTab === 'rules' ? 'border-primary text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))] bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        Alert Configuration
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'feed' && (
                    <Card className="glass-panel overflow-hidden border-border/50">
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left relative">
                                <thead className="bg-background/80 backdrop-blur-md text-muted-foreground sticky top-0 z-10 border-b border-border/50">
                                    <tr>
                                        <th className="px-6 py-4 font-bold tracking-wider uppercase text-xs">Timestamp</th>
                                        <th className="px-6 py-4 font-bold tracking-wider uppercase text-xs">Category</th>
                                        <th className="px-6 py-4 font-bold tracking-wider uppercase text-xs">Region</th>
                                        <th className="px-6 py-4 font-bold tracking-wider uppercase text-xs">Severity</th>
                                        <th className="px-6 py-4 font-bold tracking-wider uppercase text-xs">Impact Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-12 text-muted-foreground animate-pulse">Initializing Terminal Connection...</td></tr>
                                    ) : signals.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-12 text-muted-foreground">Awaiting incoming intelligence signals.</td></tr>
                                    ) : (
                                        signals.map((sig) => (
                                            <tr key={sig.id || sig.signal_id} className="hover:bg-primary/5 transition-colors cursor-crosshair group">
                                                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                                                    {new Date(sig.createdAt || sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold">{sig.category}</span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground">{sig.region}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div key={i} className={`w-2 h-3 rounded-sm opacity-80 ${i < (sig.severity || 1) ? 'bg-amber-500' : 'bg-muted'}`} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-md font-black tracking-tight text-sm ${getImpactColor(sig.impactScore || sig.impact_score)}`}>
                                                            {sig.impactScore || sig.impact_score || 0}
                                                        </span>
                                                        {(sig.impactScore >= 80 || sig.impact_score >= 80) && <Zap className="w-4 h-4 text-red-500 animate-pulse drop-shadow-md" />}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'charts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 fade-in animate-in">
                        {/* Area Chart: Impact over time */}
                        <Card className="glass-panel col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Market Impact Timeline</CardTitle>
                                <CardDescription>Aggregated impact scores over recent hours</CardDescription>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorImpact" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        />
                                        <Area type="monotone" dataKey="Avg Impact" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorImpact)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Pie Chart: Categories */}
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle>Signal Distribution by Category</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 flex justify-center pb-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            itemStyle={{ color: 'hsl(var(--primary))' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Bar Chart: Regions (Mocking with metrics) */}
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle>Top Regions Exposure</CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 pb-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics?.topRegions || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis type="number" stroke="hsl(var(--border))" tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" stroke="hsl(var(--foreground))" fontSize={12} width={80} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                    </div>
                )}

                {activeTab === 'rules' && (
                    <div className="fade-in animate-in pb-10">
                        <AlertRuleBuilder />
                    </div>
                )}
            </div>

            {/* Injected Global CSS for styling polish if needed */}
            <style>{`
                .glass-panel {
                    background: rgba(var(--card), 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(var(--border), 0.5);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .glass-button {
                    background: rgba(var(--background), 0.5);
                    backdrop-filter: blur(8px);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.5);
                }
            `}</style>
        </div>
    );
}
