import { useState, useEffect } from "react"
import { listService } from "@/services/api"
import { ArrowLeft, MoreHorizontal, FileText, FilePlus, Plus, Loader2, Pin } from "lucide-react"
import { CreateListModal } from "@/components/lists/create-list-modal"
import { ListsYoureOnModal } from "@/components/lists/lists-youre-on-modal"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { getMediaUrl } from "@/lib/utils"

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
            if (yoursRes.status === 'fulfilled') {
                const data = toArray(yoursRes.value)
                const sorted = [...data].sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return 0;
                })
                setYoursLists(sorted)
            }
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
            // Refresh discover and your lists to show updated state
            const [updatedDiscover, updatedYours] = await Promise.all([
                listService.getDiscoverPaginated(discoverOffset || 5, 0),
                listService.getYours()
            ])
            setDiscoverLists(toArray(updatedDiscover))
            setYoursLists(toArray(updatedYours))
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
        <div className="bg-black min-h-screen text-white no-scrollbar overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-6 px-4 py-2 bg-black/60 backdrop-blur-md border-b border-zinc-800">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-zinc-900 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h1 className="text-[20px] font-bold leading-5">Lists</h1>
                    <span className="text-[13px] text-zinc-500">@{userHandle}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="p-2 hover:bg-zinc-900 rounded-full cursor-pointer transition"
                        aria-label="Create new list"
                    >
                        <FilePlus className="w-5 h-5 text-white" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowListsYoureOnModal(true)}
                        className="p-2 hover:bg-zinc-900 rounded-full cursor-pointer transition"
                        aria-label="Lists you're on"
                    >
                        <MoreHorizontal className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Pinned Lists */}
            <div className="py-3 border-b border-zinc-800">
                <h2 className="px-4 text-[20px] font-bold mb-4">Pinned Lists</h2>
                {pinnedLists.length === 0 ? (
                    <div className="px-4 py-6 text-zinc-500 text-[15px] text-center border border-dashed border-zinc-800 mx-4 rounded-xl">
                        Nothing to see here yet — pin your favorite Lists to access them quickly.
                    </div>
                ) : (
                    <div className="px-4 grid grid-cols-2 gap-3 pb-2 overflow-x-auto no-scrollbar">
                        {pinnedLists.map(list => (
                            <div key={list.id} className="relative group cursor-pointer shrink-0" onClick={() => navigate(`/lists/${list.id}`)}>
                                <div className="aspect-[2/1] rounded-xl overflow-hidden bg-zinc-900 mb-2 border border-zinc-800 relative shadow-xl">
                                    {(list.banner || list.avatar) ? (
                                        <img src={getMediaUrl(list.banner || list.avatar)} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                                            <FileText className="w-8 h-8 text-zinc-700" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                                        <div className="font-bold text-white text-[15px] truncate">{list.name}</div>
                                        <div className="text-zinc-400 text-[13px]">{list.members}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Discover Lists */}
            <div className="border-b border-zinc-800 py-3">
                <h2 className="px-4 text-[20px] font-bold mb-2">Discover new Lists</h2>
                <div className="divide-y divide-zinc-800">
                    {discoverLists.map(list => (
                        <div key={list.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
                            <div className="flex items-center gap-3">
                                { (list.banner || list.avatar) ? (
                                    <img src={getMediaUrl(list.banner || list.avatar)} alt={list.name} className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shadow-lg" />
                                ) : (
                                    <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-800">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-[15px] text-white hover:underline">{list.name}</div>
                                    <div className="text-[13px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                        <span className="font-medium text-zinc-400">{list.ownerName || list.owner?.name || "User"}</span>
                                        <span>•</span>
                                        <span>{list.members}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => handleFollowList(e, list.id, list.isFollowing)}
                                className={`px-4 py-1.5 rounded-full font-bold text-sm transition duration-200 ${
                                    list.isFollowing 
                                    ? 'border border-zinc-700 text-white hover:bg-red-500/5 hover:border-red-500/50 hover:text-red-500 group' 
                                    : 'bg-white text-black hover:bg-zinc-200'
                                }`}
                            >
                                {list.isFollowing ? (
                                    <span>
                                        <span className="group-hover:hidden">Following</span>
                                        <span className="hidden group-hover:inline">Unfollow</span>
                                    </span>
                                ) : 'Follow'}
                            </button>
                        </div>
                    ))}
                </div>
                {hasMoreDiscover && (
                    <button 
                        onClick={handleShowMoreDiscover}
                        className="w-full text-center py-4 text-primary text-[15px] hover:bg-white/[0.02] transition border-t border-zinc-800 mt-2"
                    >
                        Show more
                    </button>
                )}
            </div>

            {/* Your Lists */}
            <div className="py-3">
                <h2 className="px-4 text-[20px] font-bold mb-2">Your Lists</h2>
                {yoursLists.length === 0 ? (
                    <div className="px-4 py-12 text-center text-zinc-500">
                        <p className="text-[15px]">You haven't created or followed any Lists yet.</p>
                        <p className="text-[13px] mt-1">When you do, they'll show up here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800">
                        {yoursLists.map(list => (
                            <div key={list.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
                                <div className="flex items-center gap-3">
                                    { (list.banner || list.avatar) ? (
                                        <img src={getMediaUrl(list.banner || list.avatar)} alt={list.name} className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shadow-lg" />
                                    ) : (
                                        <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-800">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold text-[15px] text-white hover:underline">{list.name}</div>
                                        <div className="text-[13px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                            <span>{list.members}</span>
                                            {list.isPrivate && <span className="text-xs bg-zinc-900 px-1.5 py-0.5 rounded ml-1 border border-zinc-800 text-zinc-400">Private</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleTogglePin(e, list.id, list.isPinned)}
                                    className={`p-2 rounded-full transition ${list.isPinned ? "text-primary hover:bg-primary/10" : "text-zinc-500 hover:bg-zinc-900"}`}
                                    title={list.isPinned ? "Unpin List" : "Pin List"}
                                >
                                    <Pin className={`w-4 h-4 ${list.isPinned ? "fill-primary" : ""}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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

