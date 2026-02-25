import { useState, useEffect } from "react"
import { 
    Megaphone, ShieldAlert, Globe, 
    Link as LinkIcon, Calendar, 
    MoreHorizontal, ArrowUpRight,
    Clock, History, CheckCircle2,
    ShieldCheck, AlertTriangle
} from "lucide-react"
import { announcementService } from "@/services/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function AnnouncementFeed() {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const res = await announcementService.getFeed()
                setAnnouncements(res)
            } catch (err) {
                console.error("Failed to fetch announcements", err)
            } finally {
                setLoading(false)
            }
        }
        fetchFeed()
    }, [])

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse border border-border/50" />
            ))}
        </div>
    )

    if (announcements.length === 0) return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Megaphone className="w-12 h-12 mb-4 opacity-20" />
            <p>No official announcements found.</p>
        </div>
    )

    return (
        <div className="space-y-6">
            {announcements.map((ann) => (
                <AnnouncementCard key={ann.id} announcement={ann} />
            ))}
        </div>
    )
}

function AnnouncementCard({ announcement }) {
    const isCritical = announcement.severityLevel >= 4
    const severity = getSeverity(announcement.severityLevel)

    return (
        <div className={cn(
            "group relative rounded-2xl border transition-all duration-300 overflow-hidden bg-background",
            isCritical ? "border-red-500/30 shadow-lg shadow-red-500/5" : "border-border/50 hover:border-primary/30"
        )}>
            {/* Severity Banner */}
            {isCritical && (
                <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-4 h-4 fill-current" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Critical Global Alert</span>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-4">
                {/* Meta Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl border", severity.bg, severity.border, severity.color)}>
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-[13px] tracking-tight hover:underline cursor-pointer">
                                    Official Institution Post
                                </span>
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 fill-current" />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                                <span className="uppercase tracking-wider">{announcement.category}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(announcement.createdAt), "MMM d, HH:mm")}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border", severity.bg, severity.border, severity.color)}>
                            Severity {announcement.severityLevel}
                        </div>
                        {announcement.immutableHash && (
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-mono">
                                <History className="w-3 h-3" />
                                {announcement.immutableHash.slice(0, 12)}...
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <h2 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                        {announcement.title}
                    </h2>
                    <p className="text-[15px] leading-relaxed text-muted-foreground line-clamp-4">
                        {announcement.content}
                    </p>
                </div>

                {/* AI Summary Hook */}
                {announcement.aiSummary && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 border-dashed space-y-2">
                        <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Executive Summary
                        </div>
                        <p className="text-[13px] text-muted-foreground whitespace-pre-wrap italic">
                            {announcement.aiSummary}
                        </p>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            {Array.isArray(announcement.regions) ? announcement.regions.join(', ') : 'Global'}
                        </div>
                        {announcement.livestreamUrl && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                LIVE BROADCAST
                            </div>
                        )}
                    </div>
                    <button className="flex items-center gap-1 text-xs font-black text-primary hover:gap-2 transition-all group/btn">
                        VIEW FULL RECORD
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function getSeverity(level) {
    const levels = [
        { level: 1, label: "Informational", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        { level: 2, label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
        { level: 3, label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
        { level: 4, label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
        { level: 5, label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" }
    ]
    return levels.find(l => l.level === level) || levels[0]
}
