import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { listService } from "@/services/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMediaUrl } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const BannerPlaceholder = () => (
    <div className="w-full h-full bg-yellow-500/20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-4 gap-4 opacity-20 pointer-events-none p-4">
            {[...Array(16)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                    {i % 2 === 0 ? <p className="text-4xl font-black text-yellow-500 rotate-12">X</p> : 
                    <div className="w-8 h-12 border-2 border-yellow-500 rounded flex flex-col p-1 gap-1">
                        <div className="w-full h-0.5 bg-yellow-500 rounded" />
                        <div className="w-2/3 h-0.5 bg-yellow-500 rounded" />
                    </div>}
                </div>
            ))}
        </div>
    </div>
)

export function ListPreviewCard({ listId }) {
    const navigate = useNavigate()
    const [list, setList] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!listId) return
        const fetchList = async () => {
            try {
                const data = await listService.getList(listId)
                setList(data)
            } catch (err) {
                console.error("Failed to fetch list preview:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchList()
    }, [listId])

    if (loading) {
        return (
            <div className="w-full h-32 flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        )
    }

    if (!list) return null

    const ownerName = list.ownerName || list.owner?.name || "User"
    const ownerHandle = list.ownerHandle || list.owner?.handle || "user"
    const avatar = list.owner?.profile?.avatar || list.owner?.avatar

    const handleCardClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(`/lists/${listId}`)
    }

    const handleOwnerClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const uid = list.ownerId || list.owner?.id
        if (uid) navigate(`/profile/${uid}`)
    }

    return (
        <div 
            onClick={handleCardClick}
            className="w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 hover:bg-zinc-900/50 transition cursor-pointer group shadow-sm"
        >
            {/* Banner */}
            <div className="w-full h-32 bg-zinc-900 relative">
                {(list.banner || list.avatar) ? (
                    <img src={getMediaUrl(list.banner || list.avatar)} className="w-full h-full object-cover" alt="" />
                ) : (
                    <BannerPlaceholder />
                )}
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-center gap-2 text-[13px] text-zinc-500 mb-1">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M3 4.5C3 3.12 4.12 2 5.5 2h13C19.88 2 21 3.12 21 4.5v15c0 1.38-1.12 2.5-2.5 2.5h-13C4.12 22 3 20.88 3 19.5v-15zM5.5 4c-.28 0-.5.22-.5.5v15c0 .28.22.5.5.5h13c.28 0 .5-.22.5-.5v-15c0-.28-.22-.5-.5-.5h-13zM16 10H8V8h8v2zm-8 2h8v2H8v-2z" />
                    </svg>
                    <span>List • {list.memberCount || 0} Members</span>
                </div>
                
                <h3 className="text-[15px] font-bold text-white mb-1 group-hover:underline">{list.name}</h3>

                <div 
                    onClick={handleOwnerClick}
                    className="flex items-center gap-2 hover:opacity-80 transition"
                >
                    <Avatar className="w-5 h-5 border border-zinc-800">
                        <AvatarImage src={getMediaUrl(avatar)} />
                        <AvatarFallback className="text-[10px] bg-zinc-800">{ownerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[14px] font-bold text-white truncate hover:underline">{ownerName}</span>
                        <span className="text-[14px] text-zinc-500 truncate">@{ownerHandle}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
