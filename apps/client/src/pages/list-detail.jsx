import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { listService } from "@/services/api"
import { PostCard } from "@/components/feed/post-card"
import { ArrowLeft, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMediaUrl } from "@/lib/utils"
import { postService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { EditListModal } from "@/components/lists/edit-list-modal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ListDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const [list, setList] = useState(null)
    const [members, setMembers] = useState([])
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("posts")
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!id) return
        const fetchData = async () => {
            setLoading(true)
            try {
                const [listData, membersData, postsData] = await Promise.all([
                    listService.getList(id),
                    listService.getMembers(id),
                    listService.getPosts(id)
                ])
                setList(listData)
                setMembers(Array.isArray(membersData) ? membersData : [])
                setPosts(Array.isArray(postsData) ? postsData : [])
            } catch (err) {
                console.error("Failed to fetch list:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId)
            setPosts(prev => prev.filter(p => p.id !== postId))
        } catch (err) {
            console.error("Failed to delete post:", err)
        }
    }

    const isOwner = currentUser?.id && list?.ownerId === currentUser.id

    const handleDeleteList = async () => {
        if (!list?.id || !isOwner) return
        if (!confirm("Are you sure you want to delete this list? This cannot be undone.")) return
        setDeleting(true)
        try {
            await listService.deleteList(list.id)
            toast.success("List deleted")
            navigate("/lists")
        } catch (err) {
            console.error("Delete list failed:", err)
            toast.error("Failed to delete list")
        } finally {
            setDeleting(false)
        }
    }

    const handleEditSuccess = (updated) => {
        if (updated) setList(prev => ({ ...prev, ...updated }))
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!list) {
        return (
            <div className="p-8 text-center text-muted-foreground">List not found</div>
        )
    }

    const ownerName = list.ownerName || list.owner?.name || "Unknown"
    const ownerHandle = list.ownerHandle || list.owner?.handle || "unknown"

    return (
        <div>
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold truncate">{list.name}</h1>
                    <p className="text-[13px] text-muted-foreground">
                        by {ownerName} <span className="text-primary">@{ownerHandle}</span>
                    </p>
                </div>
                {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                                <Pencil className="w-4 h-4 mr-2" /> Edit List
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDeleteList}
                                disabled={deleting}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete List
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            <EditListModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                list={list}
                onSuccess={handleEditSuccess}
            />

            {(list.banner || list.avatar) && (
                <div className="h-[120px] bg-zinc-800">
                    <img src={getMediaUrl(list.banner || list.avatar)} alt="" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="px-4 py-3 border-b border-border/50">
                <p className="text-[15px] text-muted-foreground">{list.description || "No description"}</p>
                <p className="text-[13px] text-muted-foreground mt-1">
                    {list.memberCount ?? 0} members · {list.followerCount ?? 0} followers
                </p>
            </div>

            <div className="flex border-b border-border/50">
                <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className={`flex-1 py-3 text-[15px] font-medium transition ${activeTab === "posts" ? "border-b-2 border-primary font-bold" : "text-muted-foreground hover:bg-white/[0.03]"}`}
                >
                    Posts
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={`flex-1 py-3 text-[15px] font-medium transition ${activeTab === "members" ? "border-b-2 border-primary font-bold" : "text-muted-foreground hover:bg-white/[0.03]"}`}
                >
                    Members
                </button>
            </div>

            {activeTab === "posts" && (
                <div className="divide-y divide-border/50">
                    {posts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No posts yet</div>
                    ) : (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
                        ))
                    )}
                </div>
            )}

            {activeTab === "members" && (
                <div className="divide-y divide-border/50">
                    {members.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No members yet</div>
                    ) : (
                        members.map(m => (
                            <div
                                key={m.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
                                onClick={() => navigate(`/profile/${m.id}`)}
                            >
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={getMediaUrl(m.avatarUrl || m.user?.profile?.avatar)} />
                                    <AvatarFallback>{(m.name || m.user?.profile?.name || "U")[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-[15px]">{m.name || m.user?.profile?.name}</div>
                                    <div className="text-[13px] text-muted-foreground">@{m.handle || m.user?.profile?.handle || "user"}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
