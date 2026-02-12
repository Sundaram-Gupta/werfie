import { useState } from "react"
import { Users, Check } from "lucide-react"

export default function Subscriptions() {
    const [tiers] = useState([
        { id: 1, name: "Supporter", price: "$4.99", perks: ["Exclusive Badge", "Ad-free content"], color: "bg-blue-500", subscribers: 85 },
        { id: 2, name: "Super Fan", price: "$9.99", perks: ["Exclusive Badge", "Ad-free content", "Monthly Q&A"], color: "bg-purple-500", subscribers: 42 },
        { id: 3, name: "VIP", price: "$24.99", perks: ["All previous perks", "Direct Message Access", "Merch Discount"], color: "bg-yellow-500", subscribers: 15 },
    ])

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Subscriptions</h2>
                    <p className="text-sm text-muted-foreground">Membership tiers and benefits</p>
                </div>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                    <div key={tier.id} className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden relative group hover:border-border transition-colors">
                        <div className={`h-2 w-full ${tier.color}`} />
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg">{tier.name}</h3>
                                    <div className="text-2xl font-bold mt-1">{tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                </div>
                                <div className="text-sm font-medium bg-zinc-800 px-2 py-1 rounded-md flex items-center gap-1.5">
                                    <Users className="w-3 h-3 text-muted-foreground" /> {tier.subscribers}
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {tier.perks.map((perk, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>{perk}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
