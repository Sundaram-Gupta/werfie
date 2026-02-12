import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, MoreVertical, Shield, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export default function TeamManagement() {
    const [teams, setTeams] = useState([
        { id: 1, name: "Sarah Chen", email: "sarah@acme.com", role: "Owner", avatar: "SC" },
        { id: 2, name: "Mike Ross", email: "mike@acme.com", role: "Admin", avatar: "MR" },
        { id: 3, name: "Jessica Pearson", email: "jessica@acme.com", role: "Editor", avatar: "JP" },
    ])
    const [inviteOpen, setInviteOpen] = useState(false)

    const handleInvite = (e) => {
        e.preventDefault()
        setInviteOpen(false)
        // Mock invite logic
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
                                Send an invitation to join your business account.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input placeholder="colleague@company.com" className="bg-zinc-900 border-border" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <select className="w-full h-10 px-3 rounded-md border border-border bg-zinc-900 text-sm">
                                    <option>Admin (Full Access)</option>
                                    <option>Editor (Content & Ads)</option>
                                    <option>Analyst (View Only)</option>
                                </select>
                            </div>
                            <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-full" onClick={handleInvite}>
                                Send Invitation
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 font-medium text-sm text-muted-foreground bg-zinc-900/50">
                    <div className="col-span-5">User</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-border/50">
                    {teams.map((member) => (
                        <div key={member.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-900/30 transition-colors group">
                            <div className="col-span-5 flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border/50">
                                    <AvatarFallback className="bg-blue-900/30 text-blue-200">{member.avatar}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{member.name}</span>
                            </div>
                            <div className="col-span-4 text-sm text-muted-foreground">
                                {member.email}
                            </div>
                            <div className="col-span-2">
                                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                                    {member.role}
                                </Badge>
                            </div>
                            <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
