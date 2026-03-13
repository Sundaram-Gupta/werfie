import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { listService } from "@/services/api"
import { toast } from "sonner"
import { Loader2, Plus, Check } from "lucide-react"

export function AddToListModal({ open, onOpenChange, user }) {
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)

    useEffect(() => {
        if (open && user) {
            fetchMembershipStatus()
        }
    }, [open, user])

    const fetchMembershipStatus = async () => {
        try {
            setLoading(true)
            const userId = user.id || user.userId
            const status = await listService.getMembershipStatus(userId)
            setLists(status)
        } catch (error) {
            console.error("Failed to fetch membership status:", error)
            toast.error("Failed to load your lists")
        } finally {
            setLoading(false)
        }
    }

    const toggleMembership = async (list) => {
        const userId = user.id || user.userId
        setActionLoading(list.id)
        try {
            if (list.isMember) {
                await listService.removeMember(list.id, userId)
                setLists(prev => prev.map(l => l.id === list.id ? { ...l, isMember: false } : l))
                toast.success(`Removed @${user.handle} from ${list.name}`)
            } else {
                await listService.addMember(list.id, userId)
                setLists(prev => prev.map(l => l.id === list.id ? { ...l, isMember: true } : l))
                toast.success(`Added @${user.handle} to ${list.name}`)
            }
        } catch (error) {
            console.error("Failed to toggle membership:", error)
            toast.error("Failed to update list member")
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-black border-[rgb(47,51,54)] p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-4 border-b border-[rgb(47,51,54)]">
                    <DialogTitle className="text-xl font-bold text-white">Add to list</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Select the lists you want to add @{user?.handle} to.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : lists.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <p className="mb-4">You haven't created any lists yet.</p>
                            <Button variant="outline" className="rounded-full border-[rgb(47,51,54)] hover:bg-[rgb(22,24,28)]">
                                Create a list
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-[rgb(47,51,54)]">
                            {lists.map(list => (
                                <div 
                                    key={list.id} 
                                    className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer"
                                    onClick={() => !actionLoading && toggleMembership(list)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[rgb(22,24,28)] border border-[rgb(47,51,54)] flex items-center justify-center">
                                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><g><path d="M3 4.5C3 3.12 4.12 2 5.5 2h13C19.88 2 21 3.12 21 4.5v15c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 22 3 20.88 3 19.5v-15zM5.5 4c-.28 0-.5.22-.5.5v15c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5v-15c0-.28-.22-.5-.5-.5h-13zM16 10H8V8h8v2zm-8 2h8v2H8v-2z"></path></g></svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-[15px]">{list.name}</div>
                                            <div className="text-[13px] text-muted-foreground">Member tracking...</div>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${list.isMember ? 'bg-primary border-primary' : 'border-[rgb(47,51,54)]'}`}>
                                        {actionLoading === list.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-white" />
                                        ) : list.isMember && (
                                            <Check className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-[rgb(47,51,54)] flex justify-end">
                    <Button 
                        variant="secondary" 
                        className="rounded-full font-bold px-6"
                        onClick={() => onOpenChange(false)}
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
