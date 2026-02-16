import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building, History, ArrowRight, Wallet, CreditCard, Loader2, Plus, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"

export default function Payouts() {
    const [profile, setProfile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [payoutMethod, setPayoutMethod] = useState("upi") // upi or card
    const [details, setDetails] = useState({
        upiId: "",
        cardName: "",
        cardNumber: "",
        expiry: "",
        cvv: ""
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/monetization/profile')
            setProfile(res.data)
            if (res.data.payoutMethod) {
                setPayoutMethod(res.data.payoutMethod)
                try {
                    setDetails(JSON.parse(res.data.payoutDetails))
                } catch (e) {}
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            toast.error("Failed to load payout details")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await api.put('/api/monetization/payout-method', {
                method: payoutMethod,
                details: details
            })
            toast.success("Payout method updated successfully")
            setIsModalOpen(false)
            fetchProfile()
        } catch (error) {
            console.error('Save error:', error)
            toast.error("Failed to save payout method")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-muted-foreground">Loading payout details...</p>
            </div>
        )
    }

    const renderMethodIcon = () => {
        if (profile?.payoutMethod === 'upi') return <Wallet className="w-6 h-6" />
        if (profile?.payoutMethod === 'card') return <CreditCard className="w-6 h-6" />
        return <Building className="w-6 h-6" />
    }

    const renderMethodLabel = () => {
        if (!profile?.payoutMethod) return "No payout method linked"
        const data = profile.payoutDetails ? JSON.parse(profile.payoutDetails) : {}
        if (profile.payoutMethod === 'upi') return `UPI: ${data.upiId || 'N/A'}`
        if (profile.payoutMethod === 'card') return `Card ending in ${data.cardNumber?.slice(-4) || '****'}`
        return profile.payoutMethod
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Payouts</h2>
                    <p className="text-sm text-muted-foreground">Manage your bank details and withdrawals</p>
                </div>
                <div className="bg-zinc-900 border border-border px-4 py-2 rounded-xl flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Available Balance:</span>
                    <span className="text-lg font-bold text-green-500">${profile?.balance?.toFixed(2) || "0.00"}</span>
                </div>
            </div>

            {/* Payout Method */}
            <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-muted-foreground text-blue-500">
                        {renderMethodIcon()}
                    </div>
                    <div>
                        <div className="font-bold">{renderMethodLabel()}</div>
                        <div className="text-sm text-muted-foreground">
                            {profile?.payoutMethod ? "Primary Payout Method" : "Add a method to receive your earnings"}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none border-border">
                                {profile?.payoutMethod ? "Edit Details" : "Add Method"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0a0a0a] border-zinc-900 sm:max-w-md p-6">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold">Add Payment Method</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setPayoutMethod('card')}
                                        className={`p-6 rounded-xl border flex flex-col items-center gap-2 transition-all ${payoutMethod === 'card' ? "border-blue-500 bg-blue-500/10 text-blue-500" : "border-border bg-zinc-900/50 text-muted-foreground"}`}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Card</span>
                                    </button>
                                    <button 
                                        onClick={() => setPayoutMethod('upi')}
                                        className={`p-6 rounded-xl border flex flex-col items-center gap-2 transition-all ${payoutMethod === 'upi' ? "border-blue-500 bg-blue-500/10 text-blue-500" : "border-border bg-zinc-900/50 text-muted-foreground"}`}
                                    >
                                        <Wallet className="w-6 h-6" />
                                        <span className="text-xs font-bold uppercase tracking-wider">UPI</span>
                                    </button>
                                </div>

                                {payoutMethod === 'card' ? (
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
                    <Button 
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold"
                        disabled={!profile?.payoutMethod || profile.balance <= 0}
                    >
                        Withdraw Earnings
                    </Button>
                </div>
            </div>

            {/* History */}
            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-bold">Withdrawal History</h3>
                </div>
                <div className="divide-y divide-border/50 text-sm">
                    {/* Placeholder for real transaction history */}
                    <div className="p-10 text-center space-y-2">
                        <History className="w-10 h-10 text-muted-foreground mx-auto opacity-20" />
                        <p className="text-muted-foreground">No withdrawal history found</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
