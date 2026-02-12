import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Plus, AlertCircle } from "lucide-react"

export default function Billing() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Billing & Payments</h2>
                    <p className="text-sm text-muted-foreground">Manage your payment methods and invoices</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Balance */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6">
                    <div className="text-sm text-muted-foreground mb-1">Outstanding Balance</div>
                    <div className="text-3xl font-bold mb-4">$125.00</div>
                    <div className="flex items-center gap-2 text-xs text-yellow-500 mb-4 bg-yellow-500/10 p-2 rounded">
                        <AlertCircle className="w-3 h-3" />
                        Next charge on Feb 28
                    </div>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-full">Pay Now</Button>
                </div>

                {/* Payment Methods */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Payment Methods</h3>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400">
                            <Plus className="w-4 h-4 mr-1" /> Add New
                        </Button>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-zinc-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-red-500 -mr-1 opacity-80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Mastercard ending in 4242</div>
                                    <div className="text-xs text-muted-foreground">Expires 12/28 • Default</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-zinc-900/30 opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-[8px] font-bold text-white tracking-tighter">VISA</div>
                                <div>
                                    <div className="font-medium text-sm">Visa ending in 8899</div>
                                    <div className="text-xs text-muted-foreground">Expires 10/25</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Make Default</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices */}
            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border/50">
                    <h3 className="font-bold">Billing History</h3>
                </div>
                <div className="divide-y divide-border/50 text-sm">
                    {[
                        { date: "Jan 31, 2026", id: "INV-2026-001", amount: "$450.00", status: "Paid" },
                        { date: "Dec 31, 2025", id: "INV-2025-012", amount: "$320.50", status: "Paid" },
                        { date: "Nov 30, 2025", id: "INV-2025-011", amount: "$125.00", status: "Paid" },
                    ].map((invoice, i) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="bg-zinc-800 p-2 rounded text-muted-foreground">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-medium">{invoice.amount}</div>
                                    <div className="text-xs text-muted-foreground">{invoice.date} • {invoice.id}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">{invoice.status}</Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
