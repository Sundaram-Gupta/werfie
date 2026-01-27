import { useState, useEffect } from "react"
import { businessService } from "@/services/api"
import { BUSINESS_DATA } from "@/lib/dummy-data"
import { ArrowLeft, MoreHorizontal, DollarSign, Megaphone, BarChart2, Handshake, ChevronRight, Loader2, CheckCircle2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export default function Business() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { tools } = BUSINESS_DATA // Keep tools from dummy data as they are static UI elements

    // State
    const [stats, setStats] = useState({ followers: "0", engagement: "0%", impressions: "0" })
    const [loading, setLoading] = useState(true)
    const [isBoostOpen, setIsBoostOpen] = useState(false)
    const [isBoosting, setIsBoosting] = useState(false)
    const [boostSuccess, setBoostSuccess] = useState(false)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await businessService.getStats()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch business stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const handleBoost = async () => {
        setIsBoosting(true)
        try {
            await businessService.boostPost("mock-post-id")
            setBoostSuccess(true)
            setTimeout(() => {
                setBoostSuccess(false)
                setIsBoostOpen(false)
            }, 2000)
        } catch (error) {
            console.error("Failed to boost post:", error)
        } finally {
            setIsBoosting(false)
        }
    }

    const iconMap = {
        DollarSign: DollarSign,
        Megaphone: Megaphone,
        BarChart2: BarChart2,
        Handshake: Handshake
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
                    <h1 className="text-[20px] font-bold leading-5">Business</h1>
                    <span className="text-[13px] text-muted-foreground">@{user?.profile?.handle || user?.handle || "user"}</span>
                </div>
                <div className="p-2 hover:bg-muted/50 rounded-full cursor-pointer transition">
                    <MoreHorizontal className="w-5 h-5" />
                </div>
            </div>

            <div className="p-4 space-y-6 pb-20">

                {/* Insights Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div onClick={() => navigate('/creator-studio')} className="bg-zinc-900 border border-border/50 rounded-xl p-3 hover:bg-zinc-900/80 transition cursor-pointer">
                        <div className="text-[13px] text-muted-foreground mb-1">Followers</div>
                        <div className="text-[18px] font-bold text-green-500">{stats.followers}</div>
                    </div>
                    <div onClick={() => navigate('/creator-studio')} className="bg-zinc-900 border border-border/50 rounded-xl p-3 hover:bg-zinc-900/80 transition cursor-pointer">
                        <div className="text-[13px] text-muted-foreground mb-1">Engagement</div>
                        <div className="text-[18px] font-bold text-blue-500">{stats.engagement}</div>
                    </div>
                    <div onClick={() => navigate('/creator-studio')} className="bg-zinc-900 border border-border/50 rounded-xl p-3 hover:bg-zinc-900/80 transition cursor-pointer">
                        <div className="text-[13px] text-muted-foreground mb-1">Impressions</div>
                        <div className="text-[18px] font-bold text-foreground">{stats.impressions}</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl flex items-center justify-between shadow-lg">
                    <div>
                        <div className="font-bold text-[16px] mb-1">Boost a post</div>
                        <div className="text-[13px] text-muted-foreground">Reach more people instantly.</div>
                    </div>
                    <Button onClick={() => setIsBoostOpen(true)} className="rounded-full font-bold bg-blue-500 hover:bg-blue-600 text-white">Start</Button>
                </div>

                {/* Tools */}
                <div>
                    <h2 className="text-[20px] font-bold mb-4">Business Tools</h2>
                    <div className="space-y-3">
                        {tools.map((tool, idx) => {
                            const Icon = iconMap[tool.icon] || BarChart2
                            return (
                                <div
                                    key={idx}
                                    onClick={() => tool.path ? navigate(tool.path) : alert("This feature is coming soon!")}
                                    className="flex items-center gap-4 p-4 border border-border/50 rounded-xl hover:bg-zinc-900/50 transition cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-[16px] group-hover:text-blue-500 transition-colors">{tool.title}</div>
                                        <div className="text-[13px] text-muted-foreground leading-4 mt-1">{tool.description}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Boost Modal */}
            <Dialog open={isBoostOpen} onOpenChange={setIsBoostOpen}>
                <DialogContent className="sm:max-w-[425px] bg-black text-white border-border [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle>Boost your reach</DialogTitle>
                        <DialogDescription>Promote your top content to reach thousands of new users.</DialogDescription>
                    </DialogHeader>

                    <div className="py-6 flex flex-col items-center justify-center space-y-4">
                        {boostSuccess ? (
                            <div className="text-center space-y-2 animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-lg">Boost Activated!</h3>
                                <p className="text-muted-foreground text-sm">Your campaign is now live.</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-4">
                                <div className="p-4 rounded-lg bg-zinc-900 border border-border">
                                    <div className="font-medium text-sm text-gray-400 mb-2">Estimated Results</div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-2xl font-bold">1.2k - 3.5k</div>
                                            <div className="text-xs text-muted-foreground">Impressions</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">50 - 150</div>
                                            <div className="text-xs text-muted-foreground">Clicks</div>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleBoost}
                                    className="w-full rounded-full font-bold h-11 bg-blue-500 hover:bg-blue-600"
                                    disabled={isBoosting}
                                >
                                    {isBoosting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Activating...
                                        </>
                                    ) : (
                                        "Confirm Boost ($10.00)"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
