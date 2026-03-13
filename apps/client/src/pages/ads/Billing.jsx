import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CreditCard, Download, Plus, AlertCircle, Loader2, Wallet, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"

export default function Billing() {
    const [adAccount, setAdAccount] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("card") // card or upi
    const [details, setDetails] = useState({
        upiId: "",
        cardName: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    })

    useEffect(() => {
        fetchAccount()
    }, [])

    const fetchAccount = async () => {
        try {
            const res = await api.get('/api/ads/account')
            setAdAccount(res.data)
            if (res.data.paymentMethod) {
                setPaymentMethod(res.data.paymentMethod)
                try {
                    setDetails(JSON.parse(res.data.paymentDetails))
                } catch (e) {}
            }
        } catch (error) {
            console.error('Failed to fetch ad account:', error)
            toast.error("Failed to load billing details")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await api.put('/api/ads/account/billing', {
                method: paymentMethod,
                details: details
            })
            toast.success("Payment method updated successfully")
            setIsModalOpen(false)
            fetchAccount()
        } catch (error) {
            console.error('Save error:', error)
            toast.error("Failed to save payment method")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-muted-foreground">Loading billing details...</p>
            </div>
        )
    }

    const renderMethodIcon = (method) => {
        if (method === 'upi') return <Wallet className="w-5 h-5" />
        return <CreditCard className="w-5 h-5" />
    }

    const renderMethodLabel = (method, detailsStr) => {
        if (!method) return "No method added"
        const data = detailsStr ? JSON.parse(detailsStr) : {}
        if (method === 'upi') return `UPI: ${data.upiId || 'N/A'}`
        if (method === 'card') return `Card ending in ${data.cardNumber?.slice(-4) || '****'}`
        return method
    }

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
                    {adAccount?.id && (
                        <div className="text-xs text-muted-foreground mb-3 font-mono truncate" title={adAccount.id}>
                            Account ID: {adAccount.id}
                        </div>
                    )}
                    <div className="text-sm text-muted-foreground mb-1">Outstanding Balance</div>
                    <div className="text-3xl font-bold mb-4">${adAccount?.balance?.toFixed(2) || "0.00"}</div>
                    <div className="flex items-center gap-2 text-xs text-yellow-500 mb-4 bg-yellow-500/10 p-2 rounded">
                        <AlertCircle className="w-3 h-3" />
                        Next charge on the 1st of next month
                    </div>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-full font-bold shadow-lg shadow-blue-500/20">Pay Now</Button>
                </div>

                {/* Payment Methods */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Payment Methods</h3>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-400">
                                    <Plus className="w-4 h-4 mr-1" /> Add New
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0a0a0a] border-zinc-900 sm:max-w-md p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold">Add Payment Method</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setPaymentMethod('card')}
                                            className={`p-6 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? "border-blue-500 bg-blue-500/10 text-blue-500" : "border-border bg-zinc-900/50 text-muted-foreground"}`}
                                        >
                                            <CreditCard className="w-6 h-6" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Card</span>
                                        </button>
                                        <button 
                                            onClick={() => setPaymentMethod('upi')}
                                            className={`p-6 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'upi' ? "border-blue-500 bg-blue-500/10 text-blue-500" : "border-border bg-zinc-900/50 text-muted-foreground"}`}
                                        >
                                            <Wallet className="w-6 h-6" />
                                            <span className="text-xs font-bold uppercase tracking-wider">UPI</span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'card' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[13px] font-bold text-zinc-400">Cardholder Name</label>
                                                <Input 
                                                    placeholder="John Doe" 
                                                    className="bg-[#1a1a1a] border-none h-12 rounded-xl" 
                                                    value={details.cardName}
                                                    onChange={e => setDetails({...details, cardName: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[13px] font-bold text-zinc-400">Card Number</label>
                                                <Input 
                                                    placeholder="0000 0000 0000 0000" 
                                                    className="bg-[#1a1a1a] border-none h-12 rounded-xl" 
                                                    value={details.cardNumber}
                                                    onChange={e => setDetails({...details, cardNumber: e.target.value})}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[13px] font-bold text-zinc-400">Expiry</label>
                                                    <Input 
                                                        placeholder="MM/YY" 
                                                        className="bg-[#1a1a1a] border-none h-12 rounded-xl" 
                                                        value={details.expiry}
                                                        onChange={e => setDetails({...details, expiry: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[13px] font-bold text-zinc-400">CVV</label>
                                                    <Input 
                                                        placeholder="123" 
                                                        type="password" 
                                                        className="bg-[#1a1a1a] border-none h-12 rounded-xl" 
                                                        value={details.cvv}
                                                        onChange={e => setDetails({...details, cvv: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[13px] font-bold text-zinc-400">UPI ID / VPA</label>
                                                <Input 
                                                    placeholder="username@upi" 
                                                    className="bg-[#1a1a1a] border-none h-12 rounded-xl"
                                                    value={details.upiId}
                                                    onChange={e => setDetails({...details, upiId: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="flex items-center gap-4 sm:justify-end mt-4">
                                    <button 
                                        className="text-white hover:text-zinc-300 transition-colors text-sm font-bold"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <Button 
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-8 h-12"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Add Method
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    
                    <div className="space-y-3">
                        {adAccount?.paymentMethod ? (
                            <div className="flex items-center justify-between p-4 border border-blue-500/30 rounded-lg bg-blue-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-blue-500">
                                        {renderMethodIcon(adAccount.paymentMethod)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{renderMethodLabel(adAccount.paymentMethod, adAccount.paymentDetails)}</div>
                                        <div className="text-xs text-muted-foreground">Default Payment Method</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>Edit</Button>
                            </div>
                        ) : (
                            <div className="text-center py-6 border border-dashed border-border rounded-lg">
                                <p className="text-sm text-muted-foreground">No payment methods added yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoices */}
            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border/50">
                    <h3 className="font-bold">Billing History</h3>
                </div>
                <div className="divide-y divide-border/50 text-sm">
                    <div className="p-10 text-center space-y-2">
                        <CreditCard className="w-10 h-10 text-muted-foreground mx-auto opacity-20" />
                        <p className="text-muted-foreground">No billing history found</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
