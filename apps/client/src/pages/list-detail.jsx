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
import { ListShareMenu } from "@/components/lists/list-share-menu"

const BannerPlaceholder = () => (
    <div className="w-full h-full bg-yellow-500/20 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-8 opacity-20 pointer-events-none p-12">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                    {i % 2 === 0 ? <p className="text-8xl font-black text-yellow-500 rotate-12">X</p> : 
                    <div className="w-24 h-32 border-4 border-yellow-500 rounded-lg flex flex-col p-4 gap-2">
                        <div className="w-full h-2 bg-yellow-500 rounded" />
                        <div className="w-2/3 h-2 bg-yellow-500 rounded" />
                    </div>}
                </div>
            ))}
        </div>
    </div>
)


import { ListUsersModal } from "@/components/lists/list-users-modal"

export default function ListDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const [list, setList] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [membersModalOpen, setMembersModalOpen] = useState(false)
    const [followersModalOpen, setFollowersModalOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [isFollowing, setIsFollowing] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [listData, postsData] = await Promise.all([
                listService.getList(id),
                listService.getPosts(id)
            ])
            setList(listData)
            setPosts(Array.isArray(postsData) ? postsData : [])
            setIsFollowing(listData?.isFollowing || false)
        } catch (err) {
            console.error("Failed to fetch list:", err)
        } finally {
            setLoading(false)
        }
    }
    
    useEffect(() => {
        if (!id) return
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

    const handleFollow = async () => {
        if (!currentUser) {
            toast.error("Please login to follow lists")
            return
        }
        try {
            if (isFollowing) {
                await listService.unfollowList(list.id)
                setIsFollowing(false)
                setList(prev => ({ ...prev, followerCount: (prev.followerCount || 1) - 1 }))
                toast.success("Unfollowed list")
            } else {
                await listService.followList(list.id)
                setIsFollowing(true)
                setList(prev => ({ ...prev, followerCount: (prev.followerCount || 0) + 1 }))
                toast.success("Followed list")
            }
        } catch (err) {
            console.error("Follow/Unfollow fail:", err)
            toast.error("An error occurred")
        }
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
        <div className="bg-black min-h-screen text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-md border-b border-zinc-800">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="hover:bg-zinc-900 p-2 rounded-full transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-[19px] font-bold leading-tight">{list.name}</h2>
                        <p className="text-[13px] text-zinc-500">@{ownerHandle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ListShareMenu listId={id} listName={list.name} />
                    {isOwner ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-900 focus-visible:ring-0">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-black border-zinc-800 text-white shadow-2xl">
                                <DropdownMenuItem onClick={() => setEditModalOpen(true)} className="hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">
                                    <Pencil className="w-4 h-4 mr-2" /> Edit List
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDeleteList}
                                    disabled={deleting}
                                    className="text-destructive focus:text-destructive hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete List
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                         <button className="p-2 hover:bg-zinc-900 rounded-full transition">
                            <MoreHorizontal className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>
            </div>

            <EditListModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                list={list}
                onSuccess={handleEditSuccess}
            />

            <ListUsersModal
                open={membersModalOpen}
                onOpenChange={setMembersModalOpen}
                listId={id}
                type="members"
            />

            <ListUsersModal
                open={followersModalOpen}
                onOpenChange={setFollowersModalOpen}
                listId={id}
                type="followers"
            />

            {/* Banner Section */}
            <div className="relative w-full h-[220px] bg-zinc-900 border-b border-zinc-800">
                {(list.banner || list.avatar) ? (
                    <img src={getMediaUrl(list.banner || list.avatar)} alt={list.name} className="w-full h-full object-cover" />
                ) : (
                    <BannerPlaceholder />
                )}
            </div>

            {/* List Info Summary */}
            <div className="flex flex-col items-center px-4 py-4 border-b border-zinc-800 text-center relative z-10">
                <h1 className="text-[23px] font-extrabold text-white mb-1">{list.name}</h1>
                
                {list.description && (
                    <p className="text-[15px] text-white mb-3 max-w-sm">{list.description}</p>
                )}
                
                <div 
                    className="flex items-center gap-2 mb-3 cursor-pointer group"
                    onClick={() => navigate(`/profile/${list.ownerId}`)}
                >
                    <Avatar className="w-6 h-6 border border-zinc-700">
                        <AvatarImage src={getMediaUrl(list.owner?.profile?.avatar)} />
                        <AvatarFallback className="bg-zinc-800 text-[10px]">{ownerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px] group-hover:underline">{ownerName}</span>
                        <span className="text-[15px] text-zinc-500">@{ownerHandle}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-[15px] mb-4">
                    <button 
                        onClick={() => setMembersModalOpen(true)}
                        className="flex items-center gap-1 hover:underline group decoration-zinc-500"
                    >
                        <span className="font-bold text-white">{list.memberCount ?? 0}</span>
                        <span className="text-zinc-500 font-medium">Members</span>
                    </button>
                    <button 
                        onClick={() => setFollowersModalOpen(true)}
                        className="flex items-center gap-1 hover:underline group decoration-zinc-500"
                    >
                        <span className="font-bold text-white">{list.followerCount ?? 0}</span>
                        <span className="text-zinc-500 font-medium">Followers</span>
                    </button>
                </div>

                {isOwner && (
                    <div className="mt-2 mb-1">
                        <button
                            onClick={() => setEditModalOpen(true)}
                            className="min-w-[130px] px-8 py-1.5 rounded-full font-bold text-[16px] border border-zinc-600 text-white hover:bg-zinc-900 transition-all duration-200"
                        >
                            Edit List
                        </button>
                    </div>
                )}

                {!isOwner && (
                    <div className="mt-2 mb-1">
                        <button
                            type="button"
                            onClick={handleFollow}
                            className={`min-w-[130px] px-8 py-1.5 rounded-full font-bold text-[16px] transition-all duration-200 ${
                                isFollowing
                                    ? "bg-transparent border border-zinc-600 text-white hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5"
                                    : "bg-white text-black hover:bg-zinc-200"
                            }`}
                        >
                            {isFollowing ? (
                                <span className="group inline-flex justify-center w-full">
                                    <span className="group-hover:hidden">Following</span>
                                    <span className="hidden group-hover:inline">Unfollow</span>
                                </span>
                            ) : (
                                "Follow"
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Posts Feed - Directly shown now like X.com */}
            <div className="divide-y divide-zinc-800">
                {posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                        <p className="font-bold text-[20px] mb-1">No posts yet</p>
                        <p className="text-[15px] text-zinc-500 max-w-xs">
                            When members of this List post, they'll show up here.
                        </p>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
                    ))
                )}
            </div>

            {/* Modals */}
            <EditListModal 
                open={editModalOpen} 
                onOpenChange={setEditModalOpen} 
                list={list} 
                onSuccess={handleEditSuccess} 
            />
            
            <ListUsersModal 
                open={membersModalOpen} 
                onOpenChange={setMembersModalOpen} 
                listId={list.id} 
                type="members" 
            />
            
            <ListUsersModal 
                open={followersModalOpen} 
                onOpenChange={setFollowersModalOpen} 
                listId={list.id} 
                type="followers" 
            />
        </div>
    )
}

