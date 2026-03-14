import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BadgeCheck, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { userService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

function FollowCard({ user, initialFollowing = false, allowFollow = false, onFollowChange }) {
    const { t } = useTranslation()
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        setIsFollowing(initialFollowing)
    }, [initialFollowing])

    const handleFollowClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (loading) return

        setLoading(true)
        const wasFollowing = isFollowing
        try {
            if (wasFollowing) {
                await userService.unfollowUser(user.id)
                setIsFollowing(false)
            } else {
                await userService.followUser(user.id)
                setIsFollowing(true)
            }
            if (onFollowChange) onFollowChange(user.id, !wasFollowing, user)
        } catch (error) {
            console.error('Follow/unfollow error:', error)
            setIsFollowing(wasFollowing)
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
                    type="button"
                    variant={isFollowing ? "outline" : "default"}
                    className={`rounded-full font-bold px-4 h-8 text-sm ${isFollowing
                        ? "bg-transparent border-border text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                        : "bg-white text-black hover:bg-white/90"
                        }`}
                    onClick={handleFollowClick}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isFollowing ? t('common.following') : t('nav.follow'))}
                </Button>
            ) : (
                <Button
                    variant="secondary"
                    disabled
                    className="rounded-full bg-[rgb(239,243,244)] text-black font-bold px-4 h-8 text-sm opacity-50 cursor-not-allowed"
                >
                    {t('common.following')}
                </Button>
            )}
        </div>
    )
}

export default function Follow() {
    const { user: currentUser } = useAuth()
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('following')
    const [following, setFollowing] = useState([])
    const [followers, setFollowers] = useState([])
    const verifiedFollowers = followers.filter(u => u.profile?.verified)
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async (silent = false) => {
        if (!currentUser?.id) return

        try {
            if (!silent) setLoading(true)

            const followingData = await userService.getFollowing(currentUser.id, { limit: 50 })
            const followingList = Array.isArray(followingData) ? followingData : (followingData?.data && Array.isArray(followingData.data) ? followingData.data : [])
            setFollowing(followingList)

            const followersData = await userService.getFollowers(currentUser.id, { limit: 50 })
            const followersList = Array.isArray(followersData)
                ? followersData
                : Array.isArray(followersData?.users)
                    ? followersData.users
                    : Array.isArray(followersData?.data)
                        ? followersData.data
                        : []
            setFollowers(followersList)

            const allSuggestionsRaw = await userService.getSuggestions(50)
            const allSuggestions = Array.isArray(allSuggestionsRaw) ? allSuggestionsRaw : (allSuggestionsRaw?.data && Array.isArray(allSuggestionsRaw.data) ? allSuggestionsRaw.data : [])
            const followingIds = new Set(followingList.map(u => u.id))
            const filtered = allSuggestions.filter(u => u && u.id !== currentUser.id && !followingIds.has(u.id))
            setSuggestions(filtered.slice(0, 12))
        } catch (error) {
            console.error('Failed to load follow data:', error)
        } finally {
            if (!silent) setLoading(false)
        }
    }, [currentUser?.id])

    const handleFollowChange = (userId, didFollow, userObj) => {
        if (didFollow && userObj) {
            setFollowing(prev => prev.some(u => u.id === userId) ? prev : [userObj, ...prev])
            setSuggestions(prev => prev.filter(u => u.id !== userId))
        } else if (!didFollow) {
            setFollowing(prev => prev.filter(u => u.id !== userId))
        }
        window.dispatchEvent(new CustomEvent('follow-state-changed', { detail: { userId, didFollow } }))
        setTimeout(() => fetchData(true), 0)
    }

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        const onFollowStateChanged = () => fetchData(true)
        window.addEventListener('follow-state-changed', onFollowStateChanged)
        return () => window.removeEventListener('follow-state-changed', onFollowStateChanged)
    }, [fetchData])

    return (
        <div>
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-border">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold">{t('follow.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('follow.subtitle')}</p>
                </div>

                {/* Tabs: Verified Followers | Followers | Following (reference: first image) */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setActiveTab('verified_followers')}
                        className={`flex-1 py-4 text-[15px] font-bold transition-colors relative ${activeTab === 'verified_followers' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('follow.section_verified_followers') || 'Verified Followers'}
                        {activeTab === 'verified_followers' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-4 text-[15px] font-bold transition-colors relative ${activeTab === 'followers' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('follow.section_followers') || 'Followers'}
                        {activeTab === 'followers' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-4 text-[15px] font-bold transition-colors relative ${activeTab === 'following' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {t('follow.section_following')}
                        {activeTab === 'following' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>
            </div>

            <div className="pb-20">
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : activeTab === 'following' ? (
                    <>
                        {/* Following Section */}
                        <div className="px-4 py-3 border-b border-border">
                            <h2 className="text-xl font-bold mb-4">{t('follow.section_following')} ({following.length})</h2>
                            {following.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('follow.empty_following')}
                                </div>
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden bg-background">
                                    {following.map((user) => (
                                        <FollowCard
                                            key={user.id}
                                            user={user}
                                            initialFollowing={true}
                                            allowFollow={true}
                                            onFollowChange={handleFollowChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Suggested Section */}
                        <div className="px-4 py-3">
                            <h2 className="text-xl font-bold mb-4">{t('follow.section_suggested')} ({suggestions.length})</h2>
                            {suggestions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('follow.empty_suggestions')}
                                </div>
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden bg-background">
                                    {suggestions.map((user) => (
                                        <FollowCard
                                            key={user.id}
                                            user={user}
                                            initialFollowing={false}
                                            allowFollow={true}
                                            onFollowChange={handleFollowChange}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : activeTab === 'verified_followers' ? (
                    /* Verified Followers Section (reference: second image layout) */
                    <div className="px-4 py-3">
                        <h2 className="text-xl font-bold mb-4">{t('follow.section_verified_followers') || 'Verified Followers'} ({verifiedFollowers.length})</h2>
                        {verifiedFollowers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('follow.empty_verified_followers') || 'No verified followers yet'}
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl overflow-hidden bg-background">
                                {verifiedFollowers.map((user) => {
                                    const followingIds = new Set(following.map(u => u.id))
                                    return (
                                        <FollowCard
                                            key={user.id}
                                            user={user}
                                            initialFollowing={followingIds.has(user.id)}
                                            allowFollow={true}
                                            onFollowChange={handleFollowChange}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Followers Section (reference: second image layout) */
                    <div className="px-4 py-3">
                        <h2 className="text-xl font-bold mb-4">{t('follow.section_followers') || 'Followers'} ({followers.length})</h2>
                        {followers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {t('follow.empty_followers') || 'No followers yet'}
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl overflow-hidden bg-background">
                                {followers.map((user) => {
                                    const followingIds = new Set(following.map(u => u.id))
                                    return (
                                        <FollowCard
                                            key={user.id}
                                            user={user}
                                            initialFollowing={followingIds.has(user.id)}
                                            allowFollow={true}
                                            onFollowChange={handleFollowChange}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
