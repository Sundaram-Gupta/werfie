import { Search, TrendingUp, BadgeCheck, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { userService, searchService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"


function TrendsList({ navigate }) {
    const [trends, setTrends] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const data = await searchService.getTrends()
                setTrends(data)
            } catch (error) {
                console.error("Failed to load trends", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTrends()
    }, [])

    if (loading) return <div className="p-4 text-center text-muted-foreground">Loading trends...</div>
    if (trends.length === 0) return <div className="p-4 text-center text-muted-foreground">No trends found</div>

    return (
        <div>
            {trends.slice(0, 5).map((trend, i) => (
                <div
                    key={trend.id || i}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(trend.name)}`)}
                    className="cursor-pointer hover:bg-white/[0.03] px-4 py-3 transition relative"
                >
                    <div className="text-[13px] text-muted-foreground flex justify-between leading-4">
                        <span>{trend.category || 'Trending'}</span>
                        <button className="hover:bg-primary/20 hover:text-primary rounded-full p-1 -mr-2 transition">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="font-bold text-[15px] mt-0.5" style={{ lineHeight: '20px' }}>{trend.name}</p>
                    {trend.volume && <p className="text-[13px] text-muted-foreground mt-0.5">{trend.volume}</p>}
                </div>
            ))}
        </div>
    )
}

function SuggestionCard({ user, navigate, onFollowChange }) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleFollow = async (e) => {
        e.stopPropagation() // Prevent navigation to profile
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
            // Call the callback to refresh the suggestions list
            if (onFollowChange) {
                onFollowChange()
            }
        } catch (error) {
            console.error('Follow/unfollow error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
            onClick={() => navigate(`/profile/${user.id}`)}
        >
            <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10 rounded-full border border-border/10">
                    <AvatarImage src={getMediaUrl(user.profile?.avatar)} />
                    <AvatarFallback>{user.profile?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-5">
                    <span className="font-bold hover:underline text-[15px]">{user.profile?.name || 'User'}</span>
                    <span className="text-muted-foreground text-[15px]">@{user.profile?.handle || 'user'}</span>
                </div>
            </div>
            <button
                onClick={(e) => {
                    handleFollow(e)
                }}
                disabled={loading}
                className={`font-bold text-[14px] px-4 py-1.5 rounded-full transition ${isFollowing
                    ? 'bg-transparent border border-border text-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50'
                    : 'bg-foreground text-background hover:opacity-90'
                    }`}
            >
                {loading ? '...' : (isFollowing ? 'Following' : 'Follow')}
            </button>
        </div>
    )
}

export function RightSidebar() {
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchSuggestions = async () => {
        try {
            const data = await userService.getSuggestions(10)
            // Filter out the current user from suggestions
            const filteredData = data.filter(user => user.id !== currentUser?.id)
            setSuggestions(filteredData)
        } catch (error) {
            console.error("Failed to load suggestions", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuggestions()
    }, [])

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            navigate(`/search?q=${encodeURIComponent(e.target.value)}`)
        }
    }

    return (
        <aside className="hidden lg:block w-[350px] pl-8 py-4 h-screen sticky top-0 overflow-y-auto no-scrollbar">
            {/* Search */}
            <div className="group sticky top-0 bg-background z-10 pb-1 pt-1">
                <div className="bg-muted/50 rounded-full py-2.5 px-4 mb-4 flex items-center gap-3 focus-within:bg-background focus-within:ring-1 ring-primary transition text-muted-foreground focus-within:text-primary border border-transparent focus-within:border-primary">
                    <Search className="w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="bg-transparent border-none outline-none text-[15px] text-foreground placeholder-muted-foreground w-full h-full"
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

            {/* Trends Widget */}
            <div className="bg-muted/30 border border-border/40 rounded-[16px] overflow-hidden mb-4">
                <h2 className="font-bold text-[20px] px-4 py-3 leading-6">What's happening</h2>
                <TrendsList navigate={navigate} />
                <div
                    className="text-primary text-[15px] p-4 cursor-pointer hover:bg-white/[0.03] transition rounded-b-[16px]"
                    onClick={() => navigate('/explore')}
                >
                    Show more
                </div>
            </div>

            {/* Who to Follow Widget */}
            <div className="bg-muted/30 border border-border/40 rounded-[16px] overflow-hidden">
                <h2 className="font-bold text-[20px] px-4 py-3 leading-6">Who to follow</h2>
                <div>
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No suggestions</div>
                    ) : (
                        suggestions.slice(0, 3).map((user) => (
                            <SuggestionCard
                                key={user.id}
                                user={user}
                                navigate={navigate}
                                onFollowChange={fetchSuggestions}
                            />
                        ))
                    )}
                </div>
                <div
                    className="text-primary text-[15px] p-4 cursor-pointer hover:bg-white/[0.03] transition rounded-b-[16px]"
                    onClick={() => navigate('/follow')}
                >
                    Show more
                </div>
            </div>

            <div className="px-4 py-4 text-[13px] text-muted-foreground leading-4 flex flex-wrap gap-x-2">
                <a href="#" className="hover:underline">Terms of Service</a>
                <a href="#" className="hover:underline">Privacy Policy</a>
                <a href="#" className="hover:underline">Cookie Policy</a>
                <a href="#" className="hover:underline">Accessibility</a>
                <a href="#" className="hover:underline">Ads info</a>
                <span>© 2026 X Corp.</span>
            </div>
        </aside>
    )
}
