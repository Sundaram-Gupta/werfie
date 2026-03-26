import { BarChart3, TrendingUp, MousePointer2, DollarSign, ArrowUpRight, ArrowDownRight, Users, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useMemo, useState } from "react"
import api from "@/lib/api"

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
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [performance, setPerformance] = useState(null)
    const [campaigns, setCampaigns] = useState([])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const [perfRes, campaignsRes] = await Promise.all([
                    api.get('/api/ads/performance'),
                    api.get('/api/ads/campaigns'),
                ])

                if (!mounted) return
                setPerformance(perfRes?.data ?? null)
                const list =
                    (Array.isArray(campaignsRes?.data) ? campaignsRes.data : null) ||
                    (Array.isArray(campaignsRes?.data?.campaigns) ? campaignsRes.data.campaigns : []) ||
                    []
                setCampaigns(list)
            } catch (e) {
                console.error('[AdsDashboard] Failed to load:', e)
                if (!mounted) return
                setError(e?.response?.data?.message || e?.message || 'Failed to load ads dashboard')
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }
        load()
        return () => {
            mounted = false
        }
    }, [])

    const metrics = useMemo(() => {
        const getByPaths = (obj, paths) => {
            if (!obj) return null
            for (const path of paths) {
                try {
                    const parts = path.split('.').filter(Boolean)
                    let cur = obj
                    for (const k of parts) cur = cur?.[k]
                    if (cur !== undefined && cur !== null) return cur
                } catch {
                    // ignore
                }
            }
            return null
        }

        const fmtNumber = (v) => {
            if (v == null) return '0'
            const n = typeof v === 'string' ? Number(v.replace(/[^0-9.]/g, '')) : v
            if (!Number.isFinite(n)) return String(v)
            if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
            if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
            return n.toLocaleString()
        }

        const fmtMoney = (v) => {
            if (v == null) return '$0.00'
            const n = typeof v === 'string' ? Number(v.replace(/[^0-9.]/g, '')) : v
            if (!Number.isFinite(n)) return String(v)
            return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }

        const totalSpendRaw = getByPaths(performance, [
            'totalSpend',
            'total_spend',
            'spend.total',
            'metrics.totalSpend',
            'metrics.total_spend',
            'spend',
            'metrics.spend',
        ])
        const impressionsRaw = getByPaths(performance, [
            'impressions',
            'metrics.impressions',
            'metrics.totalImpressions',
            'impressionsTotal',
            'impressions_total',
        ])
        const clicksRaw = getByPaths(performance, [
            'clicks',
            'metrics.clicks',
            'metrics.totalClicks',
            'clicksTotal',
            'clicks_total',
        ])
        const avgCpcRaw = getByPaths(performance, [
            'avgCpc',
            'averageCpc',
            'avg_cpc',
            'metrics.avgCpc',
            'metrics.avg_cpc',
            'metrics.cpc',
            'cpc',
        ])

        return {
            totalSpend: fmtMoney(totalSpendRaw),
            impressions: fmtNumber(impressionsRaw),
            clicks: fmtNumber(clicksRaw),
            avgCpc: fmtMoney(avgCpcRaw),
        }
    }, [performance])

    const activeCampaigns = useMemo(() => {
        const isActive = (s) => {
            const v = String(s ?? '').toLowerCase()
            return v === 'active' || v === 'running'
        }

        return (Array.isArray(campaigns) ? campaigns : [])
            .filter((c) => isActive(c?.status))
            .slice(0, 2)
    }, [campaigns])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold">Ads Overview</h2>
                <p className="text-sm text-muted-foreground">Performance for the last 30 days</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total Spend" value={metrics.totalSpend || '$0.00'} change="—" trend="up" icon={DollarSign} />
                <MetricCard title="Impressions" value={metrics.impressions || '0'} change="—" trend="up" icon={Users} />
                <MetricCard title="Clicks (CTR)" value={metrics.clicks || '0'} change="—" trend="up" icon={MousePointer2} />
                <MetricCard title="Avg. CPC" value={metrics.avgCpc || '$0.00'} change="—" trend="down" icon={Activity} />
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

                {loading ? (
                    <div className="text-sm text-muted-foreground p-4 border border-border/50 rounded-xl">
                        Loading active campaigns...
                    </div>
                ) : error ? (
                    <div className="text-sm text-red-500 p-4 border border-red-500/20 rounded-xl">
                        {error}
                    </div>
                ) : activeCampaigns.length ? (
                    <div className="space-y-3">
                        {activeCampaigns.map((c, idx) => {
                            const end = c?.endDate || c?.end_date || c?.endAt || null
                            const endsText = end ? `• Ends on ${new Date(end).toLocaleDateString()}` : ''
                            const spentToday =
                                c?.spentToday ??
                                c?.spent_today ??
                                c?.spent ??
                                c?.spend ??
                                0
                            const spentNum = typeof spentToday === 'string' ? Number(spentToday.replace(/[^0-9.]/g, '')) : spentToday
                            const spent = Number.isFinite(spentNum) ? `$${spentNum.toFixed(2)}` : '$0.00'

                            return (
                                <div
                                    key={c?.id || idx}
                                    className="bg-zinc-900/50 border border-border/50 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-12 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-blue-500'}`} />
                                        <div>
                                            <div className="font-medium truncate">
                                                {c?.name || c?.title || 'Untitled campaign'}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] h-5 px-1 border-green-500/30 text-green-500 bg-green-500/10"
                                                >
                                                    Active
                                                </Badge>
                                                <span>{endsText}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{spent}</div>
                                        <div className="text-muted-foreground text-xs">Spent today</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 border border-border/50 rounded-xl">
                        No active campaigns found.
                    </div>
                )}
            </div>
        </div>
    )
}
