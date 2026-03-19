import { Search, TrendingUp, BadgeCheck, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useCallback, useRef } from "react"
import { userService, searchService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import api from "@/lib/api"

function PostSearchResult({ post, navigate }) {
    const userLabel = post?.user?.profile?.name || post?.user?.name || post?.user?.email?.split?.('@')?.[0] || post?.user || 'Unknown'
    const handle = post?.user?.profile?.handle || post?.handle || ''
    const excerpt = (post?.content || '').toString().slice(0, 140)
    return (
        <div
            className="px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => navigate(`/post/${post.id}`)}
        >
            <div className="text-[13px] text-muted-foreground flex items-center justify-between">
                <span className="truncate">{userLabel}{handle ? ` • @${handle}` : ''}</span>
            </div>
            <div className="text-[14px] text-foreground mt-1 line-clamp-2">
                {excerpt || '(No content)'}
            </div>
        </div>
    )
}

function UserSearchResult({ user, navigate }) {
    const h = user?.profile?.handle || user?.handle || user?.email?.split('@')[0]
    const name = user?.profile?.name || user?.name || (h ? h.charAt(0).toUpperCase() + h.slice(1) : 'User')
    return (
        <div
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => navigate(`/profile/${user.id}`)}
        >
            <Avatar className="w-9 h-9 rounded-full border border-border/10 flex-shrink-0">
                <AvatarImage src={getMediaUrl(user.profile?.avatar)} />
                <AvatarFallback>{name[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                    <span className="font-bold text-[14px] truncate">{name}</span>
                    {user.profile?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10 flex-shrink-0" />}
                </div>
                <div className="text-[13px] text-muted-foreground truncate">@{h || 'user'}</div>
            </div>
        </div>
    )
}


function TrendsList({ navigate }) {
    const { t } = useTranslation()
    const [trends, setTrends] = useState([])
    const [loading, setLoading] = useState(true)
    const warnedRef = useRef(false)

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                // Use a shorter timeout to avoid 30s console spam when backend is down.
                const data = await api.get('/api/trends', { params: { limit: 20 }, timeout: 8000 }).then(r => r.data)
                setTrends(data)
            } catch (error) {
                if (!warnedRef.current) {
                    warnedRef.current = true
                    console.warn("Failed to load trends (timeout/unreachable).")
                }
            } finally {
                setLoading(false)
            }
        }
        fetchTrends()
    }, [])

    if (loading) return <div className="p-4 text-center text-muted-foreground">{t('right_sidebar.loading_trends')}</div>
    const list = Array.isArray(trends) ? trends : []
    if (list.length === 0) return <div className="p-4 text-center text-muted-foreground">{t('right_sidebar.no_trends')}</div>

    return (
        <div>
            {list.slice(0, 5).map((trend, i) => {
                const label = trend.topic ?? trend.name ?? '';
                const count = trend.posts ?? trend.volume;
                return (
                    <div
                        key={trend.id || i}
                        onClick={() => navigate(`/search?q=${encodeURIComponent(label)}`)}
                        className="cursor-pointer hover:bg-white/[0.03] px-4 py-3 transition relative"
                    >
                        <div className="text-[13px] text-muted-foreground flex justify-between leading-4">
                            <span>{trend.category || 'Trending'}</span>
                            <button className="hover:bg-primary/20 hover:text-primary rounded-full p-1 -mr-2 transition">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="font-bold text-[15px] mt-0.5" style={{ lineHeight: '20px' }}>{label}</p>
                        {count != null && <p className="text-[13px] text-muted-foreground mt-0.5">{typeof count === 'number' ? `${count.toLocaleString()} posts` : count}</p>}
                    </div>
                );
            })}
        </div>
    )
}

function SuggestionCard({ user, navigate, onFollowChange }) {
    const { t } = useTranslation()
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
            if (onFollowChange) {
                onFollowChange(user.id)
            }
        } catch (error) {
            console.error('Follow/unfollow error:', error)
        } finally {
            setLoading(false)
        }
    }

    const h = user?.profile?.handle || user?.handle || user?.email?.split('@')[0]
    const currentName = user?.profile?.name || user?.name;
    const hasRealName = currentName && currentName.trim() !== '' && currentName !== 'User';
    const displayName = hasRealName ? currentName : (h ? h.charAt(0).toUpperCase() + h.slice(1) : 'User');

    return (
        <div
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition min-w-0"
            onClick={() => navigate(`/profile/${user.id}`)}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <Avatar className="w-10 h-10 rounded-full border border-border/10 flex-shrink-0">
                    <AvatarImage src={getMediaUrl(user.profile?.avatar)} />
                    <AvatarFallback>{displayName[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-5 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold hover:underline text-[15px] truncate min-w-0">{displayName}</span>
                        {user.profile?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10 flex-shrink-0" />}
                    </div>
                    <span className="text-muted-foreground text-[15px] truncate min-w-0">@{h || 'user'}</span>
                </div>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleFollow(e)
                }}
                disabled={loading}
                className={`font-bold text-[14px] px-4 py-1.5 rounded-full transition flex-shrink-0 whitespace-nowrap ${isFollowing
                    ? 'bg-transparent border border-border text-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50'
                    : 'bg-foreground text-background hover:opacity-90'
                    }`}
            >
                {loading ? t('common.loading') : (isFollowing ? t('common.following') : t('nav.follow'))}
            </button>
        </div>
    )
}

export function RightSidebar() {
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()
    const { t } = useTranslation()
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchTab, setSearchTab] = useState('users') // 'users' | 'posts'
    const [userResults, setUserResults] = useState([])
    const [postResults, setPostResults] = useState([])
    const suggestionsCtrlRef = useRef(null)

    const fetchSuggestions = useCallback(async () => {
        if (!currentUser?.id) {
            setLoading(false)
            return
        }
        try {
            try { suggestionsCtrlRef.current?.abort?.() } catch {}
            const ctrl = new AbortController()
            suggestionsCtrlRef.current = ctrl

            const [suggestionsData, followingData] = await Promise.all([
                api.get('/api/users/suggestions', { params: { limit: 15, page: 1 }, timeout: 12000, signal: ctrl.signal }).then(r => r.data),
                api.get(`/api/users/${currentUser.id}/following`, { params: { limit: 100 }, timeout: 12000, signal: ctrl.signal }).then(r => r.data),
            ])
            const list = suggestionsData?.users ?? (Array.isArray(suggestionsData) ? suggestionsData : (suggestionsData?.data && Array.isArray(suggestionsData.data) ? suggestionsData.data : []))
            const following = Array.isArray(followingData) ? followingData : (followingData?.data && Array.isArray(followingData.data) ? followingData.data : [])
            const followingIds = new Set(following.map(u => u.id))
            const filteredData = list.filter(user => user && user.id !== currentUser.id && !followingIds.has(user.id))
            setSuggestions(filteredData)
        } catch (error) {
            // Avoid noisy console spam on slow/offline backend
            console.warn("Failed to load suggestions (timeout/unreachable).")
        } finally {
            setLoading(false)
        }
    }, [currentUser?.id])

    useEffect(() => {
        fetchSuggestions()
    }, [fetchSuggestions])

    useEffect(() => {
        window.addEventListener('follow-state-changed', fetchSuggestions)
        return () => window.removeEventListener('follow-state-changed', fetchSuggestions)
    }, [fetchSuggestions])

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const q = (e.target.value || '').toString().trim()
            if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
            setSearchOpen(false)
        }
    }

    useEffect(() => {
        const q = query.trim()
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
                setUserResults(Array.isArray(users) ? users : (users?.users || []))
                setPostResults(Array.isArray(posts) ? posts : (posts?.posts || []))
            } catch (err) {
                if (!isActive) return
                setUserResults([])
                setPostResults([])
            } finally {
                if (isActive) setSearchLoading(false)
            }
        }, 300)

        return () => {
            isActive = false
            clearTimeout(tmr)
        }
    }, [query])

    return (
        <aside className="hidden lg:block w-[350px] pl-8 py-4 h-screen sticky top-0 overflow-y-auto no-scrollbar">
            {/* Search */}
            <div className="group sticky top-0 bg-background z-10 pb-1 pt-1">
                <div className="bg-muted/50 rounded-full py-2.5 px-4 mb-1 flex items-center gap-3 focus-within:bg-background focus-within:ring-1 ring-primary transition text-muted-foreground focus-within:text-primary border border-transparent focus-within:border-primary">
                    <Search className="w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('right_sidebar.search_placeholder')}
                        className="bg-transparent border-none outline-none text-[15px] text-foreground placeholder-muted-foreground w-full h-full"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSearchOpen(true)
                        }}
                        onFocus={() => setSearchOpen(true)}
                        onKeyDown={handleSearch}
                    />
                </div>
                {searchOpen && query.trim().length > 0 && (
                    <div
                        className="mb-4 bg-background border border-border/40 rounded-[16px] overflow-hidden shadow-xl"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <div className="flex items-center gap-2 px-2 pt-2">
                            <button
                                type="button"
                                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition ${searchTab === 'users' ? 'bg-foreground text-background' : 'hover:bg-muted/60 text-muted-foreground'}`}
                                onClick={() => setSearchTab('users')}
                            >
                                Users
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition ${searchTab === 'posts' ? 'bg-foreground text-background' : 'hover:bg-muted/60 text-muted-foreground'}`}
                                onClick={() => setSearchTab('posts')}
                            >
                                Posts
                            </button>
                            <div className="ml-auto pr-2 text-[12px] text-muted-foreground">
                                {searchLoading ? 'Searching…' : ''}
                            </div>
                        </div>

                        {searchTab === 'users' ? (
                            <div className="pt-1">
                                {searchLoading ? (
                                    <div className="p-4 text-center text-muted-foreground text-[13px]">Searching users…</div>
                                ) : userResults.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-[13px]">No users found</div>
                                ) : (
                                    userResults.map((u) => <UserSearchResult key={u.id} user={u} navigate={navigate} />)
                                )}
                            </div>
                        ) : (
                            <div className="pt-1">
                                {searchLoading ? (
                                    <div className="p-4 text-center text-muted-foreground text-[13px]">Searching posts…</div>
                                ) : postResults.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-[13px]">No posts found</div>
                                ) : (
                                    postResults.map((p) => <PostSearchResult key={p.id} post={p} navigate={navigate} />)
                                )}
                            </div>
                        )}

                        <div
                            className="text-primary text-[15px] px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition border-t border-border/30"
                            onClick={() => {
                                navigate(`/search?q=${encodeURIComponent(query.trim())}`)
                                setSearchOpen(false)
                            }}
                        >
                            Show all results
                        </div>
                    </div>
                )}
            </div>

            {/* Trends Widget */}
            <div className="bg-muted/30 border border-border/40 rounded-[16px] overflow-hidden mb-4">
                <h2 className="font-bold text-[20px] px-4 py-3 leading-6">{t('right_sidebar.whats_happening')}</h2>
                <TrendsList navigate={navigate} />
                <div
                    className="text-primary text-[15px] p-4 cursor-pointer hover:bg-white/[0.03] transition rounded-b-[16px]"
                    onClick={() => navigate('/explore')}
                >
                    {t('right_sidebar.show_more')}
                </div>
            </div>

            {/* Who to Follow Widget */}
            <div className="bg-muted/30 border border-border/40 rounded-[16px] overflow-hidden">
                <h2 className="font-bold text-[20px] px-4 py-3 leading-6">{t('right_sidebar.who_to_follow')}</h2>
                <div>
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">{t('common.loading')}</div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">{t('right_sidebar.no_suggestions')}</div>
                    ) : (
                        suggestions.slice(0, 3).map((user) => (
                            <SuggestionCard
                                key={user.id}
                                user={user}
                                navigate={navigate}
                                onFollowChange={(userId) => {
                                    setSuggestions(prev => prev.filter(u => u.id !== userId))
                                    window.dispatchEvent(new CustomEvent('follow-state-changed', { detail: { userId, didFollow: true } }))
                                    fetchSuggestions()
                                }}
                            />
                        ))
                    )}
                </div>
                <div
                    className="text-primary text-[15px] p-4 cursor-pointer hover:bg-white/[0.03] transition rounded-b-[16px]"
                    onClick={() => navigate('/follow')}
                >
                    {t('right_sidebar.show_more')}
                </div>
            </div>

            <div className="px-4 py-4 text-[13px] text-muted-foreground leading-4 flex flex-wrap gap-x-2">
                <a href="#" className="hover:underline">{t('right_sidebar.terms')}</a>
                <a href="#" className="hover:underline">{t('right_sidebar.privacy')}</a>
                <a href="#" className="hover:underline">{t('right_sidebar.cookies')}</a>
                <a href="#" className="hover:underline">{t('right_sidebar.accessibility')}</a>
                <a href="#" className="hover:underline">{t('right_sidebar.ads_info')}</a>
                <span>© 2026 X Corp.</span>
            </div>
        </aside>
    )
}
