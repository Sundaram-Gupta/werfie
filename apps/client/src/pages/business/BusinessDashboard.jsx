import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
    BarChart2,
    TrendingUp,
    Users,
    MousePointer2,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    CheckCircle2,
    Circle,
    Sparkles,
    ChevronRight,
    Package,
    UsersRound,
    PenLine,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { businessService } from "@/services/api"
import { getMediaUrl, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useBusinessAccess } from "@/context/BusinessAccessContext"
import { PostCard } from "@/components/feed/post-card"

function MetricCard({ title, value, change, trend = "up", icon: Icon }) {
    const isPositive = trend === "up"
    return (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-muted-foreground group-hover:bg-[rgb(29,155,240)]/15 group-hover:text-[rgb(29,155,240)] transition-colors">
                    {Icon && <Icon className="w-4 h-4" />}
                </div>
                <Badge
                    variant="outline"
                    className={`bg-transparent border-0 ${isPositive ? "text-emerald-500" : "text-red-500"} flex items-center gap-1`}
                >
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-1">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    )
}

function formatTimeAgo(dateStr) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor(diffMs / (60 * 60 * 1000))
    const mins = Math.floor(diffMs / (60 * 1000))
    if (days >= 1) return `Posted ${days} day${days === 1 ? "" : "s"} ago`
    if (hours >= 1) return `Posted ${hours} hour${hours === 1 ? "" : "s"} ago`
    if (mins >= 1) return `Posted ${mins} min${mins === 1 ? "" : "s"} ago`
    return "Just posted"
}

function formatCount(n) {
    const num = Number(n)
    if (isNaN(num)) return "0"
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return String(Math.round(num))
}

function SetupRow({ done, title, subtitle, actionLabel, onAction }) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 py-3 border-b border-white/10 last:border-0",
                done && "opacity-80"
            )}
        >
            <div className="mt-0.5 shrink-0">
                {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                    <Circle className="w-5 h-5 text-white/25" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px] leading-snug">{title}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
            {!done && actionLabel && (
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full border-white/20 bg-transparent hover:bg-white/10"
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    )
}

function QuickCard({ title, description, icon: Icon, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] hover:border-white/15 transition-colors flex flex-col gap-3 min-h-[120px]"
        >
            <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-[rgb(29,155,240)]">
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="font-bold text-[15px] flex items-center gap-1">
                    {title}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </p>
                <p className="text-[13px] text-muted-foreground mt-1 leading-snug">{description}</p>
            </div>
        </button>
    )
}

function dayLabel(isoDay) {
    const d = new Date(isoDay)
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d)
}

export default function BusinessDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { access } = useBusinessAccess()
    const isMember = access?.role === "member"
    const canViewAnalytics = !!access?.permissions?.VIEW_ANALYTICS
    const canUpdateSettings = !!access?.permissions?.SETTINGS_UPDATE
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [profile, setProfile] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const requests = canViewAnalytics
                    ? [businessService.getStats(), businessService.getProfile()]
                    : [Promise.resolve(null), businessService.getProfile()]
                const [statsRes, profileRes] = await Promise.allSettled(requests)
                if (canViewAnalytics && statsRes.status === "fulfilled") setStats(statsRes.value)
                else if (canViewAnalytics && statsRes.status !== "fulfilled") {
                    console.error("Failed to fetch business stats:", statsRes.reason)
                    setError("Failed to load dashboard data")
                } else {
                    setStats(null)
                }
                if (profileRes.status === "fulfilled") setProfile(profileRes.value)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [canViewAnalytics])

    const selfDisplayName =
        user?.profile?.name ||
        user?.name ||
        (user?.email ? user.email.split("@")[0] : "")
    const selfHandle = user?.profile?.handle || user?.handle || user?.username || ""
    const displayName = selfDisplayName
    const handle = access?.ownerHandle || selfHandle

    const basicsDone = useMemo(() => {
        if (!profile) return false
        return !!(profile.companyName?.trim() && profile.industry?.trim() && profile.location?.trim())
    }, [profile])

    const brandingDone = useMemo(() => {
        const logo =
            profile?.logoUrl ||
            access?.businessLogoUrl ||
            access?.ownerAvatar ||
            user?.profile?.avatar ||
            user?.avatar
        const banner = profile?.bannerUrl || access?.businessBannerUrl || access?.ownerBanner || user?.profile?.banner || user?.banner
        return !!(logo && banner)
    }, [profile, access?.businessLogoUrl, access?.businessBannerUrl, access?.ownerAvatar, access?.ownerBanner, user])

    const isVerified = profile?.isVerified
    const st = (profile?.status || "").toLowerCase()
    const verifyPending = !isVerified && (st === "pending" || st === "under_review")
    const verifyDone = !!isVerified

    const checklistDoneCount = [basicsDone, brandingDone, verifyDone].filter(Boolean).length
    const checklistTotal = 3
    const progressPct = Math.round((checklistDoneCount / checklistTotal) * 100)

    if (loading) {
        return (
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground">Preparing your professional home…</p>
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    const topPosts = Array.isArray(stats?.topPosts) ? stats.topPosts : []
    const followerGrowthSeries = Array.isArray(stats?.followerGrowthSeries)
        ? stats.followerGrowthSeries
              .map((point) => ({
                  date: point?.date,
                  value: Number(point?.value) || 0,
              }))
              .filter((point) => !!point.date)
        : []
    const engagementBreakdown = stats?.engagementBreakdown || null
    const likes = Number(engagementBreakdown?.likes) || 0
    const retweets = Number(engagementBreakdown?.retweets) || 0
    const replies = Number(engagementBreakdown?.replies) || 0
    const providedTotal = Number(engagementBreakdown?.total) || 0
    const engagementTotal = providedTotal > 0 ? providedTotal : likes + retweets + replies
    const pct = (n) => (engagementTotal > 0 ? Math.round((n / engagementTotal) * 100) : 0)
    const likesPct = pct(likes)
    const retweetsPct = pct(retweets)
    const repliesPct = pct(replies)

    return (
        <div className="space-y-8">
            {/* Hero — X “Professional Home” style */}
            <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 md:p-8">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-[rgb(29,155,240)] mb-2">
                    Professional home
                </p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                    {displayName
                        ? `Welcome back, ${displayName.split(" ")[0]}`
                        : "Set up your business on Werfie"}
                </h2>
                <p className="text-[15px] text-muted-foreground max-w-xl leading-relaxed">
                    Complete a few steps so followers recognize your brand, unlock verification, and use ads and
                    analytics—similar to how X guides professional accounts from one hub.
                </p>
                {handle ? (
                    <p className="text-[14px] text-muted-foreground mt-3">
                        You’re managing <span className="text-foreground font-medium">@{handle}</span>
                    </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-full border-2 border-white/15 flex items-center justify-center text-sm font-bold"
                            style={{
                                background: `conic-gradient(rgb(29,155,240) ${progressPct}%, rgba(255,255,255,0.08) 0)`,
                            }}
                        >
                            <span className="w-11 h-11 rounded-full bg-black flex items-center justify-center text-[13px]">
                                {progressPct}%
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-[15px]">Setup checklist</p>
                            <p className="text-[13px] text-muted-foreground">
                                {checklistDoneCount} of {checklistTotal} completed
                            </p>
                        </div>
                    </div>
                    {progressPct < 100 && (
                        <Button
                            type="button"
                            className="rounded-full bg-[rgb(29,155,240)] hover:bg-[rgb(26,140,216)] text-white font-bold"
                            onClick={() => navigate("/business/profile")}
                        >
                            Continue setup
                        </Button>
                    )}
                </div>
            </section>

            {/* Checklist card */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
                <h3 className="font-bold text-lg mb-1">Finish your professional profile</h3>
                <p className="text-[13px] text-muted-foreground mb-2">
                    A complete profile helps people trust you—just like on X for Professionals.
                </p>
                <div className="mt-2">
                    <SetupRow
                        done={basicsDone}
                        title="Business details"
                        subtitle="Name, industry, and location shown on your public profile."
                        actionLabel={canUpdateSettings ? "Edit" : undefined}
                        onAction={canUpdateSettings ? () => navigate("/business/profile") : undefined}
                    />
                    <SetupRow
                        done={brandingDone}
                        title="Logo & header"
                        subtitle="Use your logo and a header image so your page looks official."
                        actionLabel={canUpdateSettings ? "Add branding" : undefined}
                        onAction={canUpdateSettings ? () => navigate("/business/profile") : undefined}
                    />
                    <SetupRow
                        done={verifyDone}
                        title={
                            verifyPending
                                ? "Verification in review"
                                : verifyDone
                                  ? "Verification"
                                  : "Get verified"
                        }
                        subtitle={
                            verifyPending
                                ? "We’re reviewing your request. You’ll be notified when it’s done."
                                : verifyDone
                                  ? "Your business is verified."
                                  : "Request verification after your profile looks ready."
                        }
                        actionLabel={verifyPending || verifyDone || !canUpdateSettings ? undefined : "Open profile"}
                        onAction={verifyPending || verifyDone || !canUpdateSettings ? undefined : () => navigate("/business/profile")}
                    />
                </div>
            </section>

            {/* Quick actions */}
            <section>
                <h3 className="font-bold text-lg mb-4">Grow & tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <QuickCard
                        title="Spotlight your profile"
                        description="Update what the public sees: contact, hours, and links."
                        icon={Sparkles}
                        onClick={() => navigate("/business/profile")}
                    />
                    {access?.permissions?.AD_MANAGE ? (
                        <QuickCard
                            title="Promote with ads"
                            description="Reach more people with campaigns tailored to your business."
                            icon={TrendingUp}
                            onClick={() => navigate("/ads")}
                        />
                    ) : (
                        <QuickCard
                            title="Post & reply"
                            description="Jump to your home feed to publish as this account."
                            icon={PenLine}
                            onClick={() => navigate("/")}
                        />
                    )}
                    <QuickCard
                        title="Products & catalog"
                        description="List what you sell so it can appear on your profile."
                        icon={Package}
                        onClick={() => navigate("/business/products")}
                    />
                    {access?.permissions?.TEAM_MANAGE && (
                        <QuickCard
                            title="Team access"
                            description="Invite teammates to help run your professional account."
                            icon={UsersRound}
                            onClick={() => navigate("/business/team")}
                        />
                    )}
                </div>
            </section>

            {canViewAnalytics && (
                <section className="space-y-4">
                <div>
                    <h3 className="text-lg font-bold">Performance</h3>
                    <p className="text-sm text-muted-foreground">
                        Snapshot for the last 30 days {error ? `· ${error}` : ""}
                    </p>
                </div>

                {stats ? (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            <MetricCard
                                title="Total followers"
                                value={stats.followers ?? "0"}
                                change={`${stats.followersGrowth ?? "0"}%`}
                                trend="up"
                                icon={Users}
                            />
                            <MetricCard
                                title="Impressions"
                                value={stats.impressions ?? "0"}
                                change={`${stats.impressionsGrowth ?? "0"}%`}
                                trend="up"
                                icon={TrendingUp}
                            />
                            <MetricCard
                                title="Engagement rate"
                                value={`${stats.engagementRate ?? "0"}%`}
                                change={stats.engagementRate ? "Current" : "—"}
                                trend={stats.engagementTrend ?? "up"}
                                icon={MousePointer2}
                            />
                            <MetricCard
                                title="Profile visits"
                                value={stats.profileVisits ?? "0"}
                                change={`${stats.profileVisitsGrowth ?? "0"}%`}
                                trend="up"
                                icon={BarChart2}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 h-72">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-semibold">Follower growth (7 days)</p>
                                    <span className="text-xs text-muted-foreground">
                                        {followerGrowthSeries.length > 1
                                            ? `${(() => {
                                                  const delta =
                                                      followerGrowthSeries[followerGrowthSeries.length - 1].value -
                                                      followerGrowthSeries[0].value
                                                  return `${delta >= 0 ? "+" : ""}${formatCount(delta)} net`
                                              })()}`
                                            : "—"}
                                    </span>
                                </div>
                                {followerGrowthSeries.length > 0 ? (
                                    <>
                                        <div className="h-44 flex items-end gap-2">
                                            {(() => {
                                                const max = Math.max(...followerGrowthSeries.map((d) => d.value || 0), 1)
                                                return followerGrowthSeries.map((d, idx) => {
                                                    const h = Math.max(10, Math.round(((d.value || 0) / max) * 100))
                                                    return (
                                                        <div key={`${d.date}-${idx}`} className="flex-1 flex flex-col items-center justify-end gap-2">
                                                            <div className="text-[10px] text-muted-foreground">{d.value}</div>
                                                            <div
                                                                className="w-full rounded-md bg-[rgb(29,155,240)]/80 hover:bg-[rgb(29,155,240)] transition-colors"
                                                                style={{ height: `${h}%` }}
                                                                title={`${d.value} followers`}
                                                            />
                                                        </div>
                                                    )
                                                })
                                            })()}
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            {followerGrowthSeries.map((d, idx) => (
                                                <div key={`${d.date}-${idx}-lbl`} className="flex-1 text-center text-[11px] text-muted-foreground">
                                                    {dayLabel(d.date)}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                                        No follower trend data yet.
                                    </div>
                                )}
                            </div>
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 h-72">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-semibold">Engagement breakdown (30 days)</p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatCount(engagementTotal)} total
                                    </span>
                                </div>
                                {engagementBreakdown ? (
                                    <div className="space-y-4 mt-3">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Likes</span>
                                                <span>{formatCount(likes)} ({likesPct}%)</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-pink-500" style={{ width: `${likesPct}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Reposts</span>
                                                <span>{formatCount(retweets)} ({retweetsPct}%)</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${retweetsPct}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>Replies</span>
                                                <span>{formatCount(replies)} ({repliesPct}%)</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-white/10">
                                                <div className="h-full rounded-full bg-[rgb(29,155,240)]" style={{ width: `${repliesPct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                                        No engagement data yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3">Top posts</h4>
                            <div className="space-y-2">
                                {topPosts.length > 0 ? (
                                    topPosts.map((post) => (
                                        <div key={post.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                                            <PostCard post={post} />
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center text-muted-foreground text-sm">
                                        No posts yet. Publish from home to see top performers here.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-muted-foreground text-sm">
                        Analytics will appear here once data is available.
                    </div>
                )}
                </section>
            )}
        </div>
    )
}
