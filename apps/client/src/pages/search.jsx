import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { searchService, postService } from "@/services/api"
import { PostCard } from "@/components/feed/post-card"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, BadgeCheck } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

export default function SearchPage() {
    const [searchParams] = useSearchParams()
    const query = searchParams.get("q") || ""
    const navigate = useNavigate()

    const [posts, setPosts] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!query) return

        const performSearch = async () => {
            setLoading(true)
            
            // Fetch posts
            try {
                const postsData = await searchService.searchPosts(query)
                console.log('Search Debug - Posts:', postsData);
                setPosts(postsData || [])
            } catch (error) {
                console.error("Search posts error:", error)
                setPosts([]) // Fallback
            }

            // Fetch users
            try {
                const usersData = await searchService.searchUsers(query)
                console.log('Search Debug - Users:', usersData);
                setUsers(usersData || [])
            } catch (error) {
                console.error("Search users error:", error)
                setUsers([]) // Fallback
            }

            setLoading(false)
        }

        performSearch()
    }, [query])

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId)
            setPosts(prev => prev.filter(p => p.id !== postId))
        } catch (err) {
            console.error('Failed to delete post:', err)
            throw err
        }
    }

    if (!query) {
        return <div className="p-8 text-center text-muted-foreground">Enter a keyword to search</div>
    }

    return (
        <div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold leading-5">Search</h1>
                    <span className="text-[13px] text-muted-foreground">{query}</span>
                </div>
            </div>

            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full h-[53px] bg-transparent border-b border-border/50 p-0 overflow-x-auto justify-between no-scrollbar sticky top-[53px] bg-background/95 backdrop-blur z-10">
                    {["Posts", "People", "Media"].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase()}
                            className="flex-1 rounded-none border-b-[4px] border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-[15px] hover:bg-muted/50 transition font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="posts" className="mt-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : posts.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {posts.map(post => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">No results for "{query}"</div>
                    )}
                </TabsContent>

                <TabsContent value="people" className="mt-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : users.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
                                    onClick={() => navigate(`/profile/${user.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={getMediaUrl(user.profile?.avatar)} />
                                            <AvatarFallback>{user.profile?.name?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold hover:underline truncate">{user.profile?.name}</span>
                                                {user.profile?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                                            </div>
                                            <span className="text-muted-foreground truncate">@{user.profile?.handle}</span>
                                            {user.profile?.bio && <span className="text-muted-foreground text-sm line-clamp-1">{user.profile.bio}</span>}
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="rounded-full h-8 px-4 font-bold text-sm">
                                        Follow
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">No people found for "{query}"</div>
                    )}
                </TabsContent>

                <TabsContent value="media" className="mt-0">
                    <div className="p-8 text-center text-muted-foreground">Media search coming soon</div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
