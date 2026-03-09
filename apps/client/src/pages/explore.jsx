import { EXPLORE_DATA } from "@/lib/dummy-data"
import { Search, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { searchService } from "@/services/api"
import { cn } from "@/lib/utils"
import { MoreOptionsDropdown } from "@/components/feed/more-options-dropdown"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function Explore() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState("foryou")
    const [trends, setTrends] = useState([])
    const [exploreItems, setExploreItems] = useState([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const loadTrends = async () => {
            try {
                const data = await searchService.getTrends()
                setTrends(data)
            } catch (e) {
                console.error(e)
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
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t('right_sidebar.search_placeholder')}
                            className="w-full bg-muted/50 rounded-full py-2.5 pl-10 pr-4 outline-none text-[15px] focus:bg-background focus:ring-1 ring-primary transition border border-transparent focus:border-primary placeholder-muted-foreground"
                            onKeyDown={e => e.key === 'Enter' && navigate(`/search?q=${encodeURIComponent(e.target.value)}`)}
                        />
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

                {/* Trending List */}
                {/* Trending List */}
                {(activeTab === "foryou" || activeTab === "trending") && (
                    <div className="divide-y divide-border/50 border-b border-border/50">
                        <h2 className="px-4 py-3 font-bold text-xl">{t('explore.trends_for_you')}</h2>
                        {trends.length === 0 ? <div className="p-4 text-muted-foreground">{t('explore.no_trends')}</div> : trends.map((item) => (
                            <div key={item.id} className="px-4 py-3 hover:bg-white/[0.03] transition cursor-pointer flex justify-between items-start" onClick={() => navigate(`/search?q=${encodeURIComponent(item.topic)}`)}>
                                <div>
                                    <div className="text-[13px] text-muted-foreground">{item.category}</div>
                                    <div className="font-bold text-[15px] mt-0.5">{item.topic}</div>
                                    <div className="text-[13px] text-muted-foreground mt-0.5">{item.posts?.toLocaleString()} posts</div>
                                </div>
                                <MoreOptionsDropdown user={{ name: item.topic, handle: item.topic.replace('#', '').toLowerCase() }} />
                            </div>
                        ))}
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
