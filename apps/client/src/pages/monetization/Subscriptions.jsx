import { useState, useEffect } from "react"
import { Users, Check, Loader2 } from "lucide-react"
import { monetizationService } from "@/services/api"

const TIER_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-green-500']

export default function Subscriptions() {
    const [tiers, setTiers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const data = await monetizationService.getTiers()
                setTiers(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error('Failed to load tiers:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchTiers()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                <p className="text-muted-foreground">Loading subscription tiers...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Subscriptions</h2>
                    <p className="text-sm text-muted-foreground">Membership tiers and benefits</p>
                </div>
            </div>

            {tiers.length === 0 ? (
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-12 text-center">
                    <p className="text-muted-foreground">No subscription tiers yet. Enable monetization to create tiers.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tiers.map((tier, i) => (
                        <div key={tier.id} className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden relative group hover:border-border transition-colors">
                            <div className={`h-2 w-full ${TIER_COLORS[i % TIER_COLORS.length]}`} />
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg">{tier.name}</h3>
                                        <div className="text-2xl font-bold mt-1">${Number(tier.price).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                    </div>
                                    <div className="text-sm font-medium bg-zinc-800 px-2 py-1 rounded-md flex items-center gap-1.5">
                                        <Users className="w-3 h-3 text-muted-foreground" /> {tier.subscribers ?? 0}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {(tier.perks || []).map((perk, j) => (
                                        <div key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                            <span>{typeof perk === 'string' ? perk : perk?.label || JSON.stringify(perk)}</span>
                                        </div>
                                    ))}
                                    {tier.description && (
                                        <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
