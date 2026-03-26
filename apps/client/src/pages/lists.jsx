import { useState, useEffect } from "react"
import { listService } from "@/services/api"
import { ArrowLeft, MoreHorizontal, FileText, FilePlus, Plus, Loader2, Pin } from "lucide-react"
import { CreateListModal } from "@/components/lists/create-list-modal"
import { ListsYoureOnModal } from "@/components/lists/lists-youre-on-modal"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

export default function Lists() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const userHandle = user?.profile?.handle || user?.handle || 'user'

    // State
    const [pinnedLists, setPinnedLists] = useState([])
    const [yoursLists, setYoursLists] = useState([])
    const [discoverLists, setDiscoverLists] = useState([])
    const [discoverOffset, setDiscoverOffset] = useState(0)
    const [hasMoreDiscover, setHasMoreDiscover] = useState(true)
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showListsYoureOnModal, setShowListsYoureOnModal] = useState(false)

    const toArray = (v) => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [])

    const handleTogglePin = async (e, listId, isPinned) => {
        e.stopPropagation();
        try {
            await listService.togglePin(listId, !isPinned);
            await fetchData();
        } catch (error) {
            console.error("Failed to toggle pin:", error);
        }
    };

    const fetchData = async () => {
        try {
            const [pinnedRes, yoursRes, discoverRes] = await Promise.allSettled([
                listService.getPinned(),
                listService.getYours(),
                listService.getDiscoverPaginated(5, 0)
            ])

            if (pinnedRes.status === 'fulfilled') setPinnedLists(toArray(pinnedRes.value))
            if (yoursRes.status === 'fulfilled') setYoursLists(toArray(yoursRes.value))
            if (discoverRes.status === 'fulfilled') {
                const data = toArray(discoverRes.value)
                setDiscoverLists(data)
                setDiscoverOffset(data.length)
                if (data.length < 5) setHasMoreDiscover(false)
            }
        } catch (error) {
            console.error("Failed to fetch lists:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleFollowList = async (e, listId, isFollowing) => {
        e.stopPropagation()
        try {
            if (isFollowing) {
                await listService.unfollowList(listId)
            } else {
                await listService.followList(listId)
            }
            // Refresh discover lists to show updated follow state
            const updatedDiscover = await listService.getDiscoverPaginated(discoverOffset || 5, 0)
            setDiscoverLists(toArray(updatedDiscover))
        } catch (error) {
            console.error("Failed to toggle list follow:", error)
        }
    }

    const handleShowMoreDiscover = async () => {
        try {
            const nextLists = await listService.getDiscoverPaginated(5, discoverOffset)
            const data = toArray(nextLists)
            if (data.length === 0) {
                setHasMoreDiscover(false)
                return
            }
            setDiscoverLists(prev => [...prev, ...data])
            setDiscoverOffset(prev => prev + data.length)
            if (data.length < 5) setHasMoreDiscover(false)
        } catch (error) {
            console.error("Failed to fetch more discover lists:", error)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
    }

    return (
        <div className="no-scrollbar overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h1 className="text-[20px] font-bold leading-5">Lists</h1>
                    <span className="text-[13px] text-muted-foreground">@{userHandle}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 hover:bg-muted/50 rounded-full cursor-pointer transition"
                        aria-label="Create new list"
                    >
                        <FilePlus className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowListsYoureOnModal(true)}
                        className="p-2 hover:bg-muted/50 rounded-full cursor-pointer transition"
                        aria-label="Lists you're on"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Pinned Lists */}
            <div className="py-3 border-b border-border/50">
                <h2 className="px-4 text-[20px] font-bold mb-3">Pinned Lists</h2>
                {pinnedLists.length === 0 ? (
                    <div className="px-4 text-muted-foreground text-sm">No pinned lists</div>
                ) : (
                    <div className="px-4 grid grid-cols-2 gap-3">
                        {pinnedLists.map(list => (
                            <div key={list.id} className="relative group cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
                                <div className="aspect-[2/1] rounded-xl overflow-hidden bg-zinc-800 mb-2 border border-border/50">
                                    <img src={list.avatar} className="w-full h-full object-cover group-hover:opacity-90 transition" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
                                        <div className="font-bold text-white text-[15px]">{list.name}</div>
                                        <div className="text-white/70 text-[13px]">{list.members}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Discover Lists */}
            <div className="border-b border-border/50 py-3">
                <h2 className="px-4 text-[20px] font-bold mb-3">Discover new Lists</h2>
                <div className="divide-y divide-border/50">
                    {discoverLists.map(list => (
                        <div key={list.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
                            <div className="flex items-center gap-3">
                                {list.avatar ? (
                                    <img src={list.avatar} alt={list.name} className="w-12 h-12 rounded-xl object-cover border border-border/50" />
                                ) : (
                                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-muted-foreground border border-border/50">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-[15px]">{list.name}</div>
                                    <div className="text-[13px] text-muted-foreground flex items-center gap-1">
                                        <span>{list.owner?.name || list.owner}</span>
                                        <span>•</span>
                                        <span>{list.members}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => handleFollowList(e, list.id, list.isFollowing)}
                                className={`${list.isFollowing ? 'border border-border text-foreground bg-transparent' : 'bg-foreground text-background'} px-4 py-1.5 rounded-full font-bold text-sm hover:opacity-90 transition`}
                            >
                                {list.isFollowing ? 'Following' : 'Follow'}
                            </button>
                        </div>
                    ))}
                </div>
                {hasMoreDiscover && (
                    <button 
                        onClick={handleShowMoreDiscover}
                        className="text-primary text-sm mt-4 hover:underline"
                    >
                        Show more
                    </button>
                )}
            </div>

            {/* Your Lists */}
            <div className="py-3">
                <h2 className="px-4 text-[20px] font-bold mb-3">Your Lists</h2>
                <div className="divide-y divide-border/50">
                    {yoursLists.map(list => (
                        <div key={list.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
                            <div className="flex items-center gap-3">
                                {list.avatar ? (
                                    <img src={list.avatar} alt={list.name} className="w-12 h-12 rounded-xl object-cover border border-border/50" />
                                ) : (
                                    <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-[15px]">{list.name}</div>
                                    <div className="text-[13px] text-muted-foreground flex items-center gap-1">
                                        <span>{list.members}</span>
                                        {list.isPrivate && <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded ml-1">Private</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleTogglePin(e, list.id, list.isPinned)}
                                className={`p-2 rounded-full transition ${list.isPinned ? "text-primary" : "text-muted-foreground hover:bg-muted/50"}`}
                                title={list.isPinned ? "Unpin List" : "Pin List"}
                            >
                                <Pin className={`w-4 h-4 ${list.isPinned ? "fill-primary" : ""}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <CreateListModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onSuccess={fetchData}
            />
            <ListsYoureOnModal
                open={showListsYoureOnModal}
                onOpenChange={setShowListsYoureOnModal}
                userHandle={userHandle}
            />
        </div>
    )
}
