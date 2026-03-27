import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, MoreVertical, Shield, Trash2, Loader2, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"

export default function TeamManagement() {
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteIdentifier, setInviteIdentifier] = useState("")
    const [inviteRole, setInviteRole] = useState("member")
    const [inviting, setInviting] = useState(false)

    const fetchTeam = useCallback(async () => {
        try {
            setLoading(true)
            const res = await api.get('/api/business/team')
            setTeams(res.data)
            setError(null)
        } catch (err) {
            console.error('Error fetching team:', err)
            setError("Failed to load team members")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTeam()
    }, [fetchTeam])

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!inviteIdentifier) return

        try {
            setInviting(true)
            await api.post('/api/business/team', {
                identifier: inviteIdentifier,
                role: inviteRole
            })
            setInviteOpen(false)
            setInviteIdentifier("")
            fetchTeam()
        } catch (err) {
            console.error('Error inviting member:', err)
            alert(err.response?.data?.error || "Failed to invite member")
        } finally {
            setInviting(false)
        }
    }

    const handleRemoveMember = async (memberId) => {
        if (!confirm("Are you sure you want to remove this team member?")) return

        try {
            await api.delete(`/api/business/team/${memberId}`)
            fetchTeam()
        } catch (err) {
            console.error('Error removing member:', err)
            alert(err.response?.data?.error || "Failed to remove member")
        }
    }

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await api.patch(`/api/business/team/${memberId}`, { role: newRole })
            fetchTeam()
        } catch (err) {
            console.error('Error updating role:', err)
            alert(err.response?.data?.error || "Failed to update role")
        }
    }

    if (loading && teams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-zinc-400">Loading your team...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Team Management</h2>
                    <p className="text-sm text-muted-foreground">Control who has access to your business account</p>
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full bg-white text-black hover:bg-white/90">
                            <Plus className="w-4 h-4 mr-2" /> Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-border">
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Enter an email address or @handle to join your business account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Identifier (Email or @handle)</label>
                                <Input 
                                    placeholder="colleague@company.com or @username" 
                                    className="bg-zinc-900 border-border" 
                                    value={inviteIdentifier}
                                    onChange={(e) => setInviteIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger className="bg-zinc-900 border-border">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-border">
                                        <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                        <SelectItem value="member">Member (Posts, replies, products)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full bg-blue-500 hover:bg-blue-600 rounded-full"
                                disabled={inviting}
                            >
                                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Send Invitation
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 font-medium text-sm text-muted-foreground bg-zinc-900/50">
                    <div className="col-span-5">User</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-border/50">
                    {(teams || []).map((member) => (
                        <div key={member.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-900/30 transition-colors group">
                            <div className="col-span-5 flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border/50">
                                    <AvatarImage src={member.user?.profile?.avatar} />
                                    <AvatarFallback className="bg-blue-900/30 text-blue-200">
                                        {member.user?.profile?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium">{member.user?.profile?.name || "User"}</span>
                                    <span className="text-xs text-muted-foreground">@{member.user?.profile?.handle}</span>
                                </div>
                            </div>
                            <div className="col-span-4 text-sm text-muted-foreground truncate">
                                {member.user?.email}
                            </div>
                            <div className="col-span-2">
                                <Select 
                                    value={member.role} 
                                    onValueChange={(newRole) => handleUpdateRole(member.userId, newRole)}
                                >
                                    <SelectTrigger className="bg-zinc-800 border-border h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-border">
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                    onClick={() => handleRemoveMember(member.userId)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {(!teams || teams.length === 0) && !loading && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No team members found. Invite someone to collaborate!
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
