import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, History, ArrowRight } from "lucide-react"

export default function Payouts() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Payouts</h2>
                    <p className="text-sm text-muted-foreground">Manage your bank details and withdrawals</p>
                </div>
            </div>

            {/* Bank Account */}
            <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-muted-foreground">
                        <Building className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="font-bold">Chase Bank **** 8899</div>
                        <div className="text-sm text-muted-foreground">Checking Account • USD</div>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-border">Edit</Button>
                    <Button className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white">Withdraw $850.00</Button>
                </div>
            </div>

            {/* History */}
            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-bold">Withdrawal History</h3>
                </div>
                <div className="divide-y divide-border/50 text-sm">
                    {[
                        { date: "Feb 01, 2026", id: "TXN-882190", amount: "$1,200.00", status: "Completed" },
                        { date: "Jan 05, 2026", id: "TXN-773211", amount: "$950.50", status: "Completed" },
                        { date: "Dec 03, 2025", id: "TXN-661200", amount: "$2,100.00", status: "Completed" },
                    ].map((txn, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors">
                            <div>
                                <div className="font-medium">{txn.date}</div>
                                <div className="text-xs text-muted-foreground">ID: {txn.id}</div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="font-bold">{txn.amount}</div>
                                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">{txn.status}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 text-center border-t border-border/50">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                        View All Transactions <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
