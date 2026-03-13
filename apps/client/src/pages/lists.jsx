import { useState, useEffect } from "react"
import { listService } from "@/services/api"
import { ArrowLeft, MoreHorizontal, FileText, FilePlus, Plus, Loader2 } from "lucide-react"
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
    const [pinned, setPinned] = useState([])
    const [yours, setYours] = useState([])
    const [discover, setDiscover] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showListsYoureOnModal, setShowListsYoureOnModal] = useState(false)

    const toArray = (v) => (Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [])

    const fetchData = async () => {
        try {
            const [pinnedData, yoursData, discoverData] = await Promise.allSettled([
                listService.getPinned(),
                listService.getYours(),
                listService.getDiscover()
            ])
            setPinned(toArray(pinnedData.status === 'fulfilled' ? pinnedData.value : []))
            setYours(toArray(yoursData.status === 'fulfilled' ? yoursData.value : []))
            setDiscover(toArray(discoverData.status === 'fulfilled' ? discoverData.value : []))
        } catch (error) {
            console.error("Failed to fetch lists data:", error)
            setPinned([])
            setYours([])
            setDiscover([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
    }

    return (
        <div>
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
                {pinned.length === 0 ? (
                    <div className="px-4 text-muted-foreground text-sm">No pinned lists</div>
                ) : (
                    <div className="px-4 grid grid-cols-2 gap-3">
                        {pinned.map(list => (
                            <div key={list.id} className="relative group cursor-pointer">
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
                    {discover.map(list => (
                        <div key={list.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-muted-foreground border border-border/50">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-[15px]">{list.name}</div>
                                    <div className="text-[13px] text-muted-foreground flex items-center gap-1">
                                        <span>{list.owner?.name || list.owner}</span>
                                        <span>•</span>
                                        <span>{list.members}</span>
                                    </div>
                                </div>
                            </div>
                            <Button size="sm" variant="secondary" className="rounded-full">
                                <Plus className="w-4 h-4 mr-1" /> Follow
                            </Button>
                        </div>
                    ))}
                    <div className="px-4 py-3 text-primary text-[15px] hover:bg-white/[0.03] cursor-pointer transition">
                        Show more
                    </div>
                </div>
            </div>

            {/* Your Lists */}
            <div className="py-3">
                <h2 className="px-4 text-[20px] font-bold mb-3">Your Lists</h2>
                <div className="divide-y divide-border/50">
                    {yours.map(list => (
                        <div key={list.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center text-muted-foreground">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-[15px]">{list.name}</div>
                                    <div className="text-[13px] text-muted-foreground flex items-center gap-1">
                                        <span>{list.members}</span>
                                        {list.isPrivate && <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded ml-1">Private</span>}
                                    </div>
                                </div>
                            </div>
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
