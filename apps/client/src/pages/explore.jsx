import { Search, Settings, BadgeCheck } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { searchService } from "@/services/api"
import { cn, getMediaUrl } from "@/lib/utils"
import { MoreOptionsDropdown } from "@/components/feed/more-options-dropdown"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const DEFAULT_TRENDS = [
    { id: "dummy-1", category: "Trending in India", topic: "#LPGCylinders", posts: 12800 },
    { id: "dummy-2", category: "Trending in India", topic: "#Budget2026", posts: 45200 },
    { id: "dummy-3", category: "Trending in India", topic: "#INDvPAK", posts: 98200 },
    { id: "dummy-4", category: "Trending in India", topic: "#TechJobs", posts: 16300 },
    { id: "dummy-5", category: "Trending in India", topic: "#RainAlert", posts: 7400 },
]

export default function Explore() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState("foryou")
    const [trends, setTrends] = useState([])
    const [trendsLoading, setTrendsLoading] = useState(true)
    const [exploreItems, setExploreItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchLoading, setSearchLoading] = useState(false)
    const [userResults, setUserResults] = useState([])
    const [postResults, setPostResults] = useState([])
    const searchRef = useRef(null)
    const navigate = useNavigate()

    // Debounced search for users + posts
    useEffect(() => {
        const q = searchQuery.trim()
        if (!q) {
            setSearchLoading(false)
            setUserResults([])
            setPostResults([])
            return
        }
        let isActive = true
        setSearchLoading(true)
        const tmr = setTimeout(async () => {
            try {
                const [users, posts] = await Promise.all([
                    searchService.searchUsers(q, { limit: 5 }),
                    searchService.searchPosts(q, { limit: 5 }),
                ])
                if (!isActive) return
                setUserResults(Array.isArray(users) ? users : (users?.users || users?.data || []))
                setPostResults(Array.isArray(posts) ? posts : (posts?.posts || posts?.data || []))
            } catch {
                if (!isActive) return
                setUserResults([])
                setPostResults([])
            } finally {
                if (isActive) setSearchLoading(false)
            }
        }, 300)
        return () => { isActive = false; clearTimeout(tmr) }
    }, [searchQuery])

    useEffect(() => {
        const loadTrends = async () => {
            setTrendsLoading(true)
            try {
                const data = await searchService.getTrends({ limit: 20, region: 'India' })
                const list = Array.isArray(data) ? data : []
                setTrends(list.length > 0 ? list : DEFAULT_TRENDS)
            } catch (e) {
                console.error(e)
                setTrends(DEFAULT_TRENDS)
            } finally {
                setTrendsLoading(false)
            }
        }
        loadTrends()
    }, [])

    useEffect(() => {
        const loadExploreItems = async () => {
            if (activeTab === 'trending') return // Trending handled by trends state

            setLoading(true)
            try {
                const items = await searchService.getExploreItems(activeTab)
                setExploreItems(Array.isArray(items) ? items : [])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadExploreItems()
    }, [activeTab])

    const tabs = [
        { id: "foryou", label: t('explore.tabs.foryou') },
        { id: "trending", label: t('explore.tabs.trending') },
        { id: "news", label: t('explore.tabs.news') },
        { id: "sports", label: t('explore.tabs.sports') },
        { id: "entertainment", label: t('explore.tabs.entertainment') },
    ]

    return (
        <div>
            {/* Sticky Header with Search */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="px-4 py-2 flex items-center gap-4">
                    <div ref={searchRef} className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t('right_sidebar.search_placeholder')}
                            className="w-full bg-muted/50 rounded-full py-2.5 pl-10 pr-4 outline-none text-[15px] focus:bg-background focus:ring-1 ring-primary transition border border-transparent focus:border-primary placeholder-muted-foreground"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchQuery.trim() && navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}
                        />
                        {searchQuery.trim().length > 0 && (
                            <div
                                className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/40 rounded-[16px] overflow-hidden shadow-xl max-h-[320px] overflow-y-auto"
                                onMouseDown={e => e.preventDefault()}
                            >
                                {searchLoading ? (
                                    <div className="p-4 text-center text-muted-foreground text-[13px]">Searching...</div>
                                ) : (userResults.length === 0 && postResults.length === 0) ? (
                                    <div className="p-4 text-center text-muted-foreground text-[13px]">No users or posts found</div>
                                ) : (
                                    <>
                                        {userResults.length > 0 && (
                                            <div className="border-b border-border/30">
                                                <div className="px-4 py-2 text-[12px] font-semibold text-muted-foreground uppercase">People</div>
                                                {userResults.map(u => (
                                                    <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer" onClick={() => navigate(`/profile/${u.id}`)}>
                                                        <Avatar className="w-9 h-9 rounded-full border border-border/10 flex-shrink-0">
                                                            <AvatarImage src={getMediaUrl(u.profile?.avatar)} />
                                                            <AvatarFallback>{(u.profile?.name || u.email?.[0] || 'U').toString().toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-bold text-[14px] truncate">{u.profile?.name || u.email?.split('@')[0]}</span>
                                                                {u.profile?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                                                            </div>
                                                            <div className="text-[13px] text-muted-foreground truncate">@{u.profile?.handle || u.email?.split('@')[0] || 'user'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {postResults.length > 0 && (
                                            <div>
                                                <div className="px-4 py-2 text-[12px] font-semibold text-muted-foreground uppercase">Posts</div>
                                                {postResults.map(p => (
                                                    <div key={p.id} className="px-4 py-3 hover:bg-white/[0.03] cursor-pointer" onClick={() => navigate(`/post/${p.id}`)}>
                                                        <div className="text-[13px] text-muted-foreground truncate">
                                                            {p?.user?.profile?.name || p?.user?.email?.split('@')[0] || 'Unknown'}
                                                            {(p?.user?.profile?.handle || p?.user?.handle) && ` • @${p?.user?.profile?.handle || p?.user?.handle}`}
                                                        </div>
                                                        <div className="text-[14px] mt-1 line-clamp-2">{(p?.content || '').toString().slice(0, 140) || '(No content)'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="text-primary text-[15px] px-4 py-3 cursor-pointer hover:bg-white/[0.03] border-t border-border/30" onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)}>
                                            Show all results
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <Settings className="w-5 h-5 cursor-pointer hover:bg-muted/50 rounded-full transition" />
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar border-b border-border/50">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-none px-4 py-3 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] font-medium relative whitespace-nowrap",
                                activeTab === tab.id ? "font-bold text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-primary rounded-full min-w-[56px] w-[90%]" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Feed */}
            <div className="">
                {/* Main Image Feature (News/Sports) */}
                {activeTab === "foryou" && (
                    <div className="relative cursor-pointer group border-b border-border/50">
                        <img
                            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                            alt="Featured"
                            className="w-full h-[280px] object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                            <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Space • LIVE</span>
                            <h2 className="text-white text-2xl font-bold leading-tight group-hover:underline">Stars align for historic deep space mission launch</h2>
                        </div>
                    </div>
                )}

                {/* Trending hashtags (spike-based, location-aware) – X-style card */}
                {(activeTab === "foryou" || activeTab === "trending") && (
                    <div className="divide-y divide-border/50 border-b border-border/50">
                        <h2 className="px-4 py-3 font-bold text-xl">{t('explore.trends_for_you')}</h2>
                        {trendsLoading ? (
                            <div className="p-4 text-muted-foreground">{t('common.loading')}</div>
                        ) : trends.length === 0 ? (
                            <div className="p-4 text-muted-foreground">{t('explore.no_trends')}</div>
                        ) : (
                            trends.map((item) => (
                                <div
                                    key={item.id}
                                    className="px-4 py-3 hover:bg-white/[0.03] transition cursor-pointer flex justify-between items-start"
                                    onClick={() => navigate(`/search?q=${encodeURIComponent(item.topic)}`)}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[13px] text-muted-foreground">{item.category}</div>
                                        <div className="font-bold text-[15px] mt-0.5 text-foreground">{item.topic?.startsWith('#') ? item.topic : `#${item.topic}`}</div>
                                        <div className="text-[13px] text-muted-foreground mt-0.5">{item.posts != null ? item.posts.toLocaleString() : 0} posts</div>
                                    </div>
                                    <MoreOptionsDropdown user={{ name: item.topic, handle: (item.topic || '').replace(/^#/, '').toLowerCase() }} />
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* News/Sports/Entertainment Cards */}
                {['foryou', 'news', 'sports', 'entertainment'].includes(activeTab) && (
                    <div className="divide-y divide-border/50">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
                        ) : exploreItems.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">{t('explore.no_items')}</div>
                        ) : (
                            exploreItems.map(item => (
                                <div
                                    key={item.id}
                                    className="px-4 py-3 hover:bg-white/[0.03] transition cursor-pointer flex justify-between items-start border-b border-border/50"
                                    onClick={() => navigate(`/search?q=${encodeURIComponent(item.topic)}`)}
                                >
                                    <div className="flex-1">
                                        <div className="text-[13px] text-muted-foreground capitalize mb-1">
                                            {item.category}
                                        </div>
                                        <div className="font-bold text-[15px] leading-5 mb-1">
                                            {item.topic}
                                        </div>
                                        {/* Description removed as it's not in new schema */}
                                        <div className="text-[13px] text-muted-foreground">
                                            {item.posts?.toLocaleString()} posts
                                        </div>
                                    </div>
                                    <MoreOptionsDropdown user={{ name: item.topic, handle: item.topic.replace('#', '').toLowerCase() }} />
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}
