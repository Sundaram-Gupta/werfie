import { useState, useEffect } from "react"
import { 
    Megaphone, Gavel, ShieldAlert, Globe, 
    FileText, Link as LinkIcon, Calendar, 
    Lock, Sparkles, Send, Save, Eye,
    Loader2, CheckCircle2, AlertTriangle, 
    ChevronRight, X, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { announcementService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    "Markets", "Health", "Conflict", "Policy", "Economy", 
    "Infrastructure", "Sports", "Other"
]

const SEVERITY_LEVELS = [
    { level: 1, label: "Informational", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { level: 2, label: "Low", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { level: 3, label: "Medium", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { level: 4, label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { level: 5, label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" }
]

const REGIONS = ["Global", "Country", "State", "Custom region"]

export default function OfficialAnnouncementDashboard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [summarizing, setSummarizing] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "Other",
        severityLevel: 1,
        regions: ["Global"],
        attachments: [],
        livestreamUrl: "",
        effectiveDate: new Date().toISOString().slice(0, 16),
        expiryDate: "",
        lockDurationMinutes: 0,
        status: "draft"
    })

    const [summary, setSummary] = useState("")

    const handleGenerateSummary = async () => {
        if (!formData.content) return toast.error("Please add content first")
        setSummarizing(true)
        try {
            const res = await announcementService.generateSummary(formData.content)
            setSummary(res.summary)
            toast.success("Executive Summary generated!")
        } catch (err) {
            toast.error("Failed to generate summary")
        } finally {
            setSummarizing(false)
        }
    }

    const handleSubmit = async (status = "published") => {
        if (!formData.title || !formData.content) {
            return toast.error("Title and Content are required")
        }

        setLoading(true)
        try {
            const institutionId = user?.institutionalProfile?.id || user?.id
            const payload = { ...formData, status, institutionId }
            console.log('[OfficialAnnouncementDashboard] Submitting payload:', payload)
            await announcementService.createAnnouncement(payload)
            toast.success(status === "published" ? "Announcement Published Successfully!" : "Draft Saved")
            if (status === "published") {
                // Reset form or redirect
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to process request")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background border-l border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Megaphone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Official Announcement Engine</h1>
                        <p className="text-xs text-muted-foreground font-medium">Source-of-Record Publishing Module</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-full shadow-sm" onClick={() => handleSubmit("draft")} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button className="rounded-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 px-6" onClick={() => handleSubmit("published")} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Publish Official
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                {/* Section 1: Core Information */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <FileText className="w-4 h-4" />
                        Core Documentation
                    </div>
                    <div className="space-y-4">
                        <Input 
                            placeholder="Official Announcement Title..." 
                            className="text-2xl font-bold py-8 bg-muted/10 border-none shadow-inner focus-visible:ring-1 focus-visible:ring-primary/30"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                        <div className="relative">
                            <Textarea 
                                placeholder="Full Content / Official Statement..." 
                                className="min-h-[300px] text-[16px] leading-relaxed p-6 bg-muted/5 border-border/50 focus-visible:ring-primary/20"
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                            />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="rounded-full gap-2 bg-background border border-border/50 hover:bg-muted"
                                    onClick={handleGenerateSummary}
                                    disabled={summarizing}
                                >
                                    {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                                    AI Summary
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Summary Result */}
                {summary && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <Sparkles className="w-4 h-4" />
                                EXECUTIVE SUMMARY
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSummary("")}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <pre className="text-sm font-sans leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {summary}
                        </pre>
                    </div>
                )}

                {/* Section 2: Metadata & Classification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            <ShieldAlert className="w-4 h-4" />
                            Security & Severity
                        </div>
                        <div className="space-y-8 p-6 bg-muted/20 rounded-2xl border border-border/50">
                            <div>
                                <label className="text-sm font-bold mb-4 block">Severity Scale</label>
                                <div className="flex items-center justify-between gap-1">
                                    {SEVERITY_LEVELS.map((sl) => (
                                        <div 
                                            key={sl.level}
                                            onClick={() => setFormData({...formData, severityLevel: sl.level})}
                                            className={cn(
                                                "flex-1 text-center py-3 rounded-xl cursor-pointer transition-all border",
                                                formData.severityLevel === sl.level 
                                                    ? `${sl.bg} ${sl.border} ${sl.color} ring-2 ring-primary/10 shadow-lg` 
                                                    : "bg-background border-border hover:bg-muted/50 text-muted-foreground"
                                            )}
                                        >
                                            <div className="text-xl font-bold mb-1">{sl.level}</div>
                                            <div className="text-[10px] font-bold uppercase">{sl.label}</div>
                                        </div>
                                    ))}
                                </div>
                                {formData.severityLevel >= 4 && (
                                    <div className="mt-4 flex gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20 items-center">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <span className="text-[11px] font-bold text-red-500">WARNING: CRITICAL ALERT MODE WILL BE ACTIVATED PLATFORM-WIDE</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold block">Information Lock Mode</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-[11px] text-muted-foreground mb-2">Disable interactions for specified minutes to ensure chronological priority.</p>
                                        <Input 
                                            type="number" 
                                            placeholder="Minutes (e.g. 60)" 
                                            className="bg-background"
                                            value={formData.lockDurationMinutes}
                                            onChange={e => setFormData({...formData, lockDurationMinutes: e.target.value})}
                                        />
                                    </div>
                                    <div className={cn("p-3 rounded-xl border", formData.lockDurationMinutes > 0 ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-muted/50 border-border text-muted-foreground")}>
                                        <Lock className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            <Globe className="w-4 h-4" />
                            Region & Scope
                        </div>
                        <div className="space-y-6 p-6 bg-muted/20 rounded-2xl border border-border/50">
                            <div>
                                <label className="text-sm font-bold mb-3 block">Affected Regions</label>
                                <div className="flex flex-wrap gap-2">
                                    {REGIONS.map(region => (
                                        <div 
                                            key={region}
                                            onClick={() => {
                                                const current = formData.regions
                                                const next = current.includes(region) ? current.filter(r => r !== region) : [...current, region]
                                                setFormData({...formData, regions: next})
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all border",
                                                formData.regions.includes(region) 
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                                                    : "bg-background border-border hover:bg-muted"
                                            )}
                                        >
                                            {region}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold mb-2 block">Category</label>
                                <select 
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/30"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Scheduling & Attachments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            <Calendar className="w-4 h-4" />
                            Scheduling
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Effective Date</label>
                                <Input 
                                    type="datetime-local" 
                                    className="bg-muted/10 border-border/50"
                                    value={formData.effectiveDate}
                                    onChange={e => setFormData({...formData, effectiveDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Expiry (Optional)</label>
                                <Input 
                                    type="datetime-local" 
                                    className="bg-muted/10 border-border/50"
                                    value={formData.expiryDate}
                                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            <LinkIcon className="w-4 h-4" />
                            External Resources
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">Live Stream URL (Direct Hook)</label>
                            <Input 
                                placeholder="https://broadcast.gov/live/id..." 
                                className="bg-muted/10 border-border/50"
                                value={formData.livestreamUrl}
                                onChange={e => setFormData({...formData, livestreamUrl: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Footnote */}
                <div className="pt-10 border-t border-border/30 flex items-start gap-3">
                    <Gavel className="w-5 h-5 text-muted-foreground shrink-0" />
                    <p className="text-[12px] text-muted-foreground leading-relaxed italic">
                        This system generates a SHA256 immutable hash upon publication. Any subsequent modifications will be logged as a new version in the audit trail. High-severity alerts (>4) trigger immediate platform-wide critical notification broadcast.
                    </p>
                </div>
            </div>
        </div>
    )
}
