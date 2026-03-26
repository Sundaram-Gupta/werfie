import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { listService, userService } from "@/services/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMediaUrl } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { Loader2, BadgeCheck } from "lucide-react"

function UserRow({ user, navigate }) {
    const [isFollowing, setIsFollowing] = useState(user.isFollowing || false)
    const [loading, setLoading] = useState(false)

    const handleFollow = async (e) => {
        e.stopPropagation()
        if (loading) return
        setLoading(true)
        try {
            if (isFollowing) {
                await userService.unfollowUser(user.id)
                setIsFollowing(false)
            } else {
                await userService.followUser(user.id)
                setIsFollowing(true)
            }
        } catch (error) {
            console.error('Follow error:', error)
        } finally {
            setLoading(false)
        }
    }

    const h = user.handle || 'user'
    const name = user.name || 'User'

    return (
        <div 
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
            onClick={() => navigate(`/profile/${user.id}`)}
        >
            <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-10 h-10 border border-border/10">
                    <AvatarImage src={getMediaUrl(user.avatarUrl)} />
                    <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 leading-5">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px] truncate hover:underline">{name}</span>
                        {user.user?.profile?.verified && <BadgeCheck className="w-4 h-4 text-primary fill-primary/10" />}
                    </div>
                    <span className="text-muted-foreground text-[14px] truncate">@{h}</span>
                </div>
            </div>
            <button
                onClick={handleFollow}
                disabled={loading}
                className={`font-bold text-[14px] px-4 py-1.5 rounded-full transition ${
                    isFollowing
                        ? 'bg-transparent border border-border text-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50'
                        : 'bg-foreground text-background hover:opacity-90'
                }`}
            >
                {isFollowing ? "Following" : "Follow"}
            </button>
        </div>
    )
}

export function ListUsersModal({ open, onOpenChange, listId, type = 'members' }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (!open || !listId) return
        
        const fetchUsers = async () => {
            setLoading(true)
            try {
                let data
                if (type === 'members') {
                    data = await listService.getMembers(listId)
                } else {
                    data = await listService.getFollowers(listId)
                }
                setUsers(data)
            } catch (error) {
                console.error(`Failed to fetch ${type}:`, error)
            } finally {
                setLoading(false)
            }
        }
        
        fetchUsers()
    }, [open, listId, type])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-zinc-800 text-white h-[80vh] flex flex-col">
                <DialogHeader className="p-4 border-b border-zinc-800 shrink-0">
                    <DialogTitle className="text-xl font-bold">
                        {type === 'members' ? 'List members' : 'List followers'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">Showing users for this list</DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center text-zinc-500">
                            <p className="font-bold text-white text-lg mb-1">No {type} yet</p>
                            <p className="text-[15px]">When people are added or start following, they'll show up here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {users.map((user) => (
                                <UserRow key={user.id} user={user} navigate={navigate} />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
