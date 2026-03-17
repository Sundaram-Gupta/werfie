import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Activity, AlertTriangle, TrendingUp, Download, Eye, Globe } from 'lucide-react';
import { getDashboardMetrics, getMarketSignals, exportToCSV, exportToJSON } from '../services/enterprise.api';
import AlertRuleBuilder from '../components/enterprise/AlertRuleBuilder';
import { io } from 'socket.io-client';
import { getContentServiceUrl } from '@/lib/api';

const ENTERPRISE_SERVICE_URL = getContentServiceUrl();

export default function EnterpriseDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [signals, setSignals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'rules', 'charts'

    useEffect(() => {
        fetchData();

        // Connect to Enterprise WebSocket Namespace for live signals
        const socket = io(`${ENTERPRISE_SERVICE_URL}/enterprise-signals`, { path: '/ws/world-leaders' });

        socket.on('connect', () => {
            console.log("Connected to Enterprise Live Feed");
        });

        socket.on('new_market_signal', (newSignal) => {
            console.log("Received new market signal!", newSignal);
            // Prepend new signal
            setSignals(prev => [newSignal, ...prev].slice(0, 100)); // Keep last 100
        });

        return () => {
            socket.disconnect();
        };
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

    const getImpactColor = (score) => {
        if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (score >= 50) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    };

    return (
        <div className="flex-1 w-full min-h-screen border-x border-border/50 bg-background pb-20 sm:pb-0">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 p-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" />
                        Enterprise Intelligence
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Market signals extracted from verified global institutional announcements.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToJSON}>
                        <Download className="w-4 h-4 mr-2" /> Export JSON
                    </Button>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Metrics Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Signals</CardTitle>
                            <Globe className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.totalSignals || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">High Impact (&ge;75)</CardTitle>
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.highImpactSignalsToday || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Impact Score</CardTitle>
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.averageImpact || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Watch Rules</CardTitle>
                            <Eye className="w-4 h-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics?.activeAlerts || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border mb-4">
                    <button 
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'feed' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('feed')}
                    >
                        Live Signal Feed
                    </button>
                    <button 
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'rules' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setActiveTab('rules')}
                    >
                        Alert Rules Builder
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'feed' && (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Timestamp</th>
                                        <th className="px-4 py-3 font-medium">Category</th>
                                        <th className="px-4 py-3 font-medium">Region</th>
                                        <th className="px-4 py-3 font-medium">Severity (1-5)</th>
                                        <th className="px-4 py-3 font-medium">Impact Score</th>
                                        <th className="px-4 py-3 font-medium">Volatility Index</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr><td colSpan="6" className="text-center py-8">Loading signals...</td></tr>
                                    ) : signals.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No market signals to display.</td></tr>
                                    ) : (
                                        signals.map((sig) => (
                                            <tr key={sig.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                    {new Date(sig.createdAt).toLocaleTimeString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">{sig.category}</Badge>
                                                </td>
                                                <td className="px-4 py-3">{sig.region}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <div key={i} className={`w-2 h-2 rounded-full ${i < sig.severity ? 'bg-red-500' : 'bg-muted'}`} />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-md border font-bold ${getImpactColor(sig.impactScore)}`}>
                                                        {sig.impactScore}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {sig.volatilityIndex ? `± ${sig.volatilityIndex}%` : '--'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === 'rules' && (
                    <AlertRuleBuilder />
                )}
            </div>
        </div>
    );
}
