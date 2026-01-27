import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BadgeCheck, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { userService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

function FollowCard({ user, initialFollowing = false, allowFollow = false, onFollowChange }) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleFollowClick = async (e) => {
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
            if (onFollowChange) onFollowChange()
        } catch (error) {
            console.error('Follow/unfollow error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-border last:border-0"
            onClick={() => navigate(`/profile/${user.id}`)}
        >
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={getMediaUrl(user.profile?.avatar)} />
                    <AvatarFallback>{user.profile?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px] hover:underline">{user.profile?.name || 'User'}</span>
                        {user.profile?.verified && <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />}
                    </div>
                    <span className="text-muted-foreground text-[15px]">@{user.profile?.handle || 'user'}</span>
                    {user.profile?.bio && <p className="text-[14px] text-white/90 mt-0.5 line-clamp-2">{user.profile.bio}</p>}
                </div>
            </div>

            {allowFollow ? (
                <Button
                    variant={isFollowing ? "outline" : "default"}
                    className={`rounded-full font-bold px-4 h-8 text-sm ${isFollowing
                        ? "bg-transparent border-border text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                        : "bg-white text-black hover:bg-white/90"
                        }`}
                    onClick={handleFollowClick}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFollowing ? "Following" : "Follow")}
                </Button>
            ) : (
                <Button
                    variant="secondary"
                    disabled
                    className="rounded-full bg-[rgb(239,243,244)] text-black font-bold px-4 h-8 text-sm opacity-50 cursor-not-allowed"
                >
                    Following
                </Button>
            )}
        </div>
    )
}

export default function Follow() {
    const { user: currentUser } = useAuth()
    const [following, setFollowing] = useState([])
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        if (!currentUser?.id) return

        try {
            setLoading(true)

            // Fetch users the current user is following
            const followingData = await userService.getFollowing(currentUser.id, { limit: 50 })
            setFollowing(followingData)

            // Fetch suggested users (users not currently followed)
            const allSuggestions = await userService.getSuggestions(50)
            // Filter out current user and users already followed
            const followingIds = new Set(followingData.map(u => u.id))
            const filtered = allSuggestions.filter(u => u.id !== currentUser.id && !followingIds.has(u.id))
            setSuggestions(filtered.slice(0, 12))
        } catch (error) {
            console.error('Failed to load follow data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [currentUser])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div>
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-border px-4 py-3">
                <h1 className="text-xl font-bold">Follow</h1>
                <p className="text-sm text-muted-foreground">People you may know and accounts you follow</p>
            </div>

            <div className="pb-20">
                {/* Following Section */}
                <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-xl font-bold mb-4">Following ({following.length})</h2>
                    {following.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            You're not following anyone yet
                        </div>
                    ) : (
                        <div className="border border-border rounded-xl overflow-hidden bg-background">
                            {following.map((user) => (
                                <FollowCard
                                    key={user.id}
                                    user={user}
                                    initialFollowing={true}
                                    onFollowChange={fetchData}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Suggested Section */}
                <div className="px-4 py-3">
                    <h2 className="text-xl font-bold mb-4">Suggested for You ({suggestions.length})</h2>
                    {suggestions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No suggestions available
                        </div>
                    ) : (
                        <div className="border border-border rounded-xl overflow-hidden bg-background">
                            {suggestions.map((user) => (
                                <FollowCard
                                    key={user.id}
                                    user={user}
                                    allowFollow={true}
                                    onFollowChange={fetchData}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
