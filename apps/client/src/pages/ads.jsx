import { useState, useEffect } from "react"
import { adService } from "@/services/api"
import { ArrowLeft, Plus, Settings, BarChart3, DollarSign, X, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function Ads() {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State
    const [campaigns, setCampaigns] = useState([])
    const [performance, setPerformance] = useState({ reach: "0", engagement: "0%", cpc: "$0.00" })
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newCampaign, setNewCampaign] = useState({ name: "", budget: "", goal: "Reach" })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [campaignsData, performanceData] = await Promise.all([
                    adService.getCampaigns(),
                    adService.getPerformance()
                ])
                setCampaigns(campaignsData)
                setPerformance(performanceData)
            } catch (error) {
                console.error("Failed to fetch ads data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleCreateCampaign = async (e) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            const campaign = await adService.createCampaign(newCampaign)
            setCampaigns([campaign, ...campaigns])
            setIsCreateOpen(false)
            setNewCampaign({ name: "", budget: "", goal: "Reach" })
        } catch (error) {
            console.error("Failed to create campaign:", error)
        } finally {
            setIsCreating(false)
        }
    }

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
    }

    return (
        <div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h1 className="text-[20px] font-bold leading-5">Ads Manager</h1>
                    <span className="text-[13px] text-muted-foreground">@{user?.profile?.handle || user?.handle || "user"}</span>
                </div>
                <div className="p-2 hover:bg-muted/50 rounded-full cursor-pointer transition">
                    <Settings className="w-5 h-5" />
                </div>
            </div>

            <div className="p-4 space-y-6 pb-20">

                {/* Performance Summary */}
                <div>
                    <h2 className="text-[18px] font-bold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Performance (Last 30 Days)
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-900 border border-border/50 rounded-xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 transition group-hover:bg-blue-500/20" />
                            <div className="text-[13px] text-muted-foreground mb-1">Reach</div>
                            <div className="text-[20px] font-bold">{performance.reach}</div>
                        </div>
                        <div className="bg-zinc-900 border border-border/50 rounded-xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full -mr-8 -mt-8 transition group-hover:bg-green-500/20" />
                            <div className="text-[13px] text-muted-foreground mb-1">Engagement</div>
                            <div className="text-[20px] font-bold">{performance.engagement}</div>
                        </div>
                        <div className="bg-zinc-900 border border-border/50 rounded-xl p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8 transition group-hover:bg-purple-500/20" />
                            <div className="text-[13px] text-muted-foreground mb-1">Avg. CPC</div>
                            <div className="text-[20px] font-bold">{performance.cpc}</div>
                        </div>
                    </div>
                </div>

                {/* Create Ad CTA */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-dashed border-border rounded-xl">
                    <div className="flex-1 mr-4">
                        <div className="font-bold text-[16px] mb-1">Create a new Campaign</div>
                        <div className="text-[13px] text-muted-foreground">Launch a new ad in minutes with our simple tools.</div>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="rounded-full font-bold bg-white text-black hover:bg-white/90">
                        <Plus className="w-4 h-4 mr-2" /> Create Ad
                    </Button>
                </div>

                {/* Campaigns List */}
                <div>
                    <h2 className="text-[20px] font-bold mb-4">Active Campaigns</h2>
                    <div className="space-y-3">
                        {campaigns.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">No active campaigns</div>
                        ) : (
                            campaigns.map(campaign => (
                                <div key={campaign.id} className="p-4 border border-border/50 rounded-xl hover:bg-zinc-900/50 transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-[16px] mb-1 group-hover:text-blue-500 transition-colors">{campaign.name}</div>
                                        <Badge variant={campaign.status === "Active" ? "default" : "secondary"} className={cn(campaign.status === "Active" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "")}>
                                            {campaign.status}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-[13px]">
                                        <div>
                                            <div className="text-muted-foreground">Budget</div>
                                            <div className="font-medium">{campaign.budget}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Impressions</div>
                                            <div className="font-medium">{campaign.impressions}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Clicks</div>
                                            <div className="font-medium">{campaign.clicks}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Campaign Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[425px] bg-black text-white border-border [&>button]:hidden">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle>New Campaign</DialogTitle>
                        <button onClick={() => setIsCreateOpen(false)} className="bg-zinc-800 p-1 rounded-full"><X className="w-4 h-4" /></button>
                    </DialogHeader>
                    <form onSubmit={handleCreateCampaign} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Campaign Name</label>
                            <Input
                                placeholder="e.g., Summer Sale"
                                value={newCampaign.name}
                                onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Daily Budget ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder="50"
                                    value={newCampaign.budget}
                                    onChange={e => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                                    className="bg-[#202327] border-none pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Goal</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Reach', 'Engagement', 'Traffic', 'Sales'].map(goal => (
                                    <div
                                        key={goal}
                                        onClick={() => setNewCampaign({ ...newCampaign, goal })}
                                        className={cn(
                                            "cursor-pointer p-3 rounded-lg border text-sm text-center transition",
                                            newCampaign.goal === goal
                                                ? "bg-blue-500/10 border-blue-500 text-blue-500"
                                                : "border-border hover:bg-zinc-900"
                                        )}
                                    >
                                        {goal}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4">
                            <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 rounded-full font-bold h-11" disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Launching...
                                    </>
                                ) : (
                                    "Launch Campaign"
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
