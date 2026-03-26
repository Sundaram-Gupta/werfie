import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, User, Clock, Trash2, BadgeCheck, MessageSquare } from 'lucide-react'
import { searchService } from '@/services/api'
import { getMediaUrl } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslation } from 'react-i18next'

const RECENT_SEARCHES_KEY = 'werfie:recent_searches'
const MAX_RECENT = 10

function HighlightText({ text, highlight }) {
    if (!highlight || !highlight.trim()) return <span>{text}</span>
    
    // Split highlight into terms for multi-word highlighting
    const terms = highlight.trim().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return <span>{text}</span>
    
    // Create a regex that matches any of the terms
    const regex = new RegExp(`(${terms.join('|')})`, 'gi')
    const parts = text.split(regex)
    
    return (
        <span>
            {parts.map((part, i) => {
                const isMatch = terms.some(t => t.toLowerCase() === part.toLowerCase());
                return isMatch 
                    ? <span key={i} className="text-primary font-bold">{part}</span> 
                    : <span key={i}>{part}</span>
            })}
        </span>
    )
}

export function ModernSearch() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [loading, setLoading] = useState(false)
    const [userResults, setUserResults] = useState([])
    const [postResults, setPostResults] = useState([])
    const [recentSearches, setRecentSearches] = useState([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const containerRef = useRef(null)
    const inputRef = useRef(null)

    // Load recent searches on mount
    useEffect(() => {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse recent searches', e)
            }
        }
    }, [])

    // Save recent search
    const saveRecentSearch = useCallback((item) => {
        setRecentSearches(prev => {
            // Remove if already exists (to move to top)
            const filtered = prev.filter(i => 
                (i.type === 'user' && i.data.id !== item.data?.id) || 
                (i.type === 'keyword' && i.data !== item.data)
            )
            const updated = [item, ...filtered].slice(0, MAX_RECENT)
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
            return updated
        })
    }, [])

    // Remove individual recent search
    const removeRecentSearch = (index, e) => {
        e.stopPropagation()
        const updated = recentSearches.filter((_, i) => i !== index)
        setRecentSearches(updated)
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    }

    // Clear all recent searches
    const clearAllRecent = () => {
        setRecentSearches([])
        localStorage.removeItem(RECENT_SEARCHES_KEY)
    }

    // Debounced search
    useEffect(() => {
        const q = query.trim()
        if (!q) {
            setLoading(false)
            setUserResults([])
            setPostResults([])
            return
        }

        setLoading(true)
        const timeoutId = setTimeout(async () => {
            try {
                const [users, posts] = await Promise.all([
                    searchService.searchUsers(q, { limit: 5 }),
                    searchService.searchPosts(q, { limit: 5 })
                ])
                setUserResults(Array.isArray(users) ? users : (users?.users || users?.data || []))
                setPostResults(Array.isArray(posts) ? posts : (posts?.posts || posts?.data || []))
            } catch (err) {
                console.error('Search error:', err)
                setUserResults([])
                setPostResults([])
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query])

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectUser = (user) => {
        saveRecentSearch({ type: 'user', data: user })
        setIsFocused(false)
        setQuery('')
        navigate(`/profile/${user.id}`)
    }

    const handleSearchSubmit = (keyword) => {
        const k = keyword || query.trim()
        if (!k) return
        saveRecentSearch({ type: 'keyword', data: k })
        setIsFocused(false)
        setQuery('')
        navigate(`/search?q=${encodeURIComponent(k)}`)
    }

    const handleKeyDown = (e) => {
        const resultsCount = query.trim() ? (userResults.length + postResults.length) : recentSearches.length
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(prev => (prev < resultsCount - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(prev => (prev > -1 ? prev - 1 : -1))
        } else if (e.key === 'Enter') {
            if (activeIndex === -1) {
                handleSearchSubmit()
            } else {
                if (query.trim()) {
                    if (activeIndex < userResults.length) {
                        handleSelectUser(userResults[activeIndex])
                    } else {
                        // It's a post result, navigate to full search
                        handleSearchSubmit(query)
                    }
                } else {
                    const item = recentSearches[activeIndex]
                    if (item.type === 'user') handleSelectUser(item.data)
                    else handleSearchSubmit(item.data)
                }
            }
        } else if (e.key === 'Escape') {
            setIsFocused(false)
            inputRef.current?.blur()
        }
    }

    return (
        <div ref={containerRef} className="relative w-full group">
            {/* Search Input Container */}
            <div 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 border
                    ${isFocused 
                        ? 'bg-background border-primary ring-1 ring-primary' 
                        : 'bg-muted/50 border-transparent group-hover:bg-muted/70'}`}
            >
                <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={t('right_sidebar.search_placeholder') || 'Search'}
                    className="bg-transparent border-none outline-none text-[15px] text-foreground placeholder-muted-foreground w-full h-full"
                    value={query}
                    onFocus={() => setIsFocused(true)}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setActiveIndex(-1)
                    }}
                    onKeyDown={handleKeyDown}
                />
                {query && (
                    <button 
                        onClick={() => setQuery('')}
                        className="p-1 hover:bg-primary/10 rounded-full transition text-primary"
                    >
                        <X className="w-4 h-4 fill-current" />
                    </button>
                )}
            </div>

            {/* Dropdown Menu */}
            {isFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden z-50 min-h-[100px] max-h-[80vh] overflow-y-auto no-scrollbar">
                    {/* Recent Searches Header */}
                    {!query.trim() && (
                        <>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                                <span className="font-bold text-[20px]">Recent</span>
                                {recentSearches.length > 0 && (
                                    <button 
                                        onClick={clearAllRecent}
                                        className="text-primary text-[14px] hover:bg-primary/10 px-3 py-1 rounded-full transition font-semibold"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                            
                            {recentSearches.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-[14px]">
                                    Try searching for people or keywords
                                </div>
                            ) : (
                                <div className="py-1">
                                    {recentSearches.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() => item.type === 'user' ? handleSelectUser(item.data) : handleSearchSubmit(item.data)}
                                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition
                                                ${activeIndex === i ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {item.type === 'user' ? (
                                                    <Avatar className="w-10 h-10 border border-border/10">
                                                        <AvatarImage src={getMediaUrl(item.data.profile?.avatar)} />
                                                        <AvatarFallback>{(item.data.profile?.name || item.data.name || 'U')[0].toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center">
                                                        <Search className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-[15px] truncate">
                                                            {item.type === 'user' ? (item.data.profile?.name || item.data.name) : item.data}
                                                        </span>
                                                        {item.type === 'user' && item.data.profile?.verified && (
                                                            <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                                                        )}
                                                    </div>
                                                    {item.type === 'user' && (
                                                        <span className="text-muted-foreground text-[14px] truncate">
                                                            @{item.data.profile?.handle || item.data.handle || 'user'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => removeRecentSearch(i, e)}
                                                className="p-1.5 hover:bg-primary/20 hover:text-primary rounded-full transition"
                                            >
                                                <X className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Search Results */}
                    {query.trim() && (
                        <div className="py-2">
                            {loading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                </div>
                            ) : (userResults.length === 0 && postResults.length === 0) ? (
                                <div className="px-4 py-8 text-center text-muted-foreground text-[14px]">
                                    No results found for "{query}"
                                </div>
                            ) : (
                                <>
                                    {/* People Section */}
                                    {userResults.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/20">
                                                People
                                            </div>
                                            {userResults.map((user, i) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition
                                                        ${activeIndex === i ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
                                                >
                                                    <Avatar className="w-10 h-10 border border-border/10 flex-shrink-0">
                                                        <AvatarImage src={getMediaUrl(user.profile?.avatar)} />
                                                        <AvatarFallback>{(user.profile?.name || user.name || 'U')[0].toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex flex-col">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold text-[15px] truncate">
                                                                <HighlightText text={user.profile?.name || user.name} highlight={query} />
                                                            </span>
                                                            {user.profile?.verified && (
                                                                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                                                            )}
                                                            {user.institutionalProfile && (
                                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1">
                                                                    {user.institutionalProfile.institutionType?.replace('_', ' ') || 'INSTITUTION'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-muted-foreground text-[14px] truncate">
                                                            @<HighlightText text={user.profile?.handle || user.handle || 'user'} highlight={query} />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Posts Section */}
                                    {postResults.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/20 border-t border-border/30">
                                                Posts
                                            </div>
                                            {postResults.map((post, i) => (
                                                <div
                                                    key={post.id}
                                                    onClick={() => handleSearchSubmit(query)}
                                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition
                                                        ${activeIndex === (userResults.length + i) ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <MessageSquare className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="font-bold text-[14px]">
                                                                {post.user?.profile?.name || 'User'}
                                                            </span>
                                                            <span className="text-muted-foreground text-[12px]">
                                                                @{post.user?.profile?.handle || 'user'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[14px] text-foreground/90 line-clamp-2 leading-tight">
                                                            <HighlightText text={post.content} highlight={query} />
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div 
                                        onClick={() => handleSearchSubmit()}
                                        className="px-4 py-3 text-primary text-[15px] hover:bg-white/[0.03] cursor-pointer transition border-t border-border/30"
                                    >
                                        Search for "{query}"
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
