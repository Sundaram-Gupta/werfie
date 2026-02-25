import { 
    Megaphone, Globe, 
    ArrowUpRight, Clock, History, 
    CheckCircle2, ShieldCheck, AlertTriangle 
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export function AnnouncementFeedCard({ announcement }) {
    const isCritical = announcement.severityLevel >= 4
    const severity = getSeverity(announcement.severityLevel)

    return (
        <div className={cn(
            "group relative border-b transition-all duration-300 overflow-hidden bg-background px-4 py-5",
            isCritical ? "border-red-500/20 bg-red-500/5" : "border-border hover:bg-white/[0.02]"
        )}>
            {/* Header / Meta */}
            <div className="flex items-start justify-between mb-4">
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
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2 ml-1">
                <h2 className="text-lg font-black leading-tight group-hover:text-primary transition-colors">
                    {announcement.title}
                </h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground line-clamp-3">
                    {announcement.content}
                </p>
            </div>

            {/* AI Summary Hook */}
            {announcement.aiSummary && (
                <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/20 border-dashed space-y-1.5 ml-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        AI Executive Summary
                    </div>
                    <p className="text-[12px] text-muted-foreground whitespace-pre-wrap italic">
                        {announcement.aiSummary}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between ml-1">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />
                        {Array.isArray(announcement.regions) ? announcement.regions.join(', ') : 'Global'}
                    </div>
                    {announcement.livestreamUrl && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                        </div>
                    )}
                </div>
                <button className="flex items-center gap-1 text-[11px] font-black text-primary hover:gap-2 transition-all">
                    VIEW DETAILS
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
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
