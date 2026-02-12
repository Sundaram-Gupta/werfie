import { Gift, Heart } from "lucide-react"

export default function Tips() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Tips</h2>
                    <p className="text-sm text-muted-foreground">See who's supporting your content</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-500">
                        <Heart className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold mb-1">$350.00</div>
                    <div className="text-sm text-muted-foreground">Total Tips (All Time)</div>
                </div>
                 <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                        <Gift className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold mb-1">45</div>
                    <div className="text-sm text-muted-foreground">Total Tippers</div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border/50 font-medium">Recent Tips</div>
                <div className="divide-y divide-border/50">
                    {[
                        { user: "Alex J.", amount: "$5.00", message: "Love your content! Keep it up!", time: "2 hours ago" },
                        { user: "Sarah M.", amount: "$10.00", message: "Thanks for the tutorial!", time: "5 hours ago" },
                        { user: "Mike R.", amount: "$2.00", message: "☕️", time: "1 day ago" },
                        { user: "Anonymous", amount: "$20.00", message: "", time: "2 days ago" },
                    ].map((tip, i) => (
                        <div key={i} className="p-4 hover:bg-zinc-900/30 transition-colors flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold shrink-0">
                                {tip.user.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-sm">{tip.user} <span className="font-normal text-muted-foreground text-xs">• {tip.time}</span></div>
                                    <div className="font-bold text-green-500">{tip.amount}</div>
                                </div>
                                {tip.message && (
                                    <div className="text-sm bg-zinc-800/50 p-2 rounded-lg inline-block text-zinc-300">
                                        {tip.message}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
