import { ArrowLeft, MoreHorizontal, Calendar, Link as LinkIcon, MapPin, Mail, Loader2, MessageCircle, BadgeCheck, User, Play } from "lucide-react"
import { toast } from "sonner"
import { useNavigate, useParams } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/post-card"
import { useState, useEffect, useMemo, useRef } from "react"
import { cn, getMediaUrl } from "@/lib/utils"
import { getApiBase } from "@/lib/api"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import { userService, postService, highlightsService, articlesService } from "@/services/api"
import { EditProfileModal } from "@/components/profile/edit-profile-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SetupProgress } from "@/components/profile/setup-progress"
import { BusinessProfileView } from "@/components/profile/business-profile-view"
import { Briefcase, ShoppingBag, Zap } from "lucide-react"

import { useTranslation } from "react-i18next"

export default function Profile() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { userId } = useParams() // Get userId from URL
    const { user: currentUser, updateUser, loading: authLoading } = useAuth()
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [postCount, setPostCount] = useState(0)
    const [replies, setReplies] = useState([])
    const [likedPosts, setLikedPosts] = useState([])
    const [highlights, setHighlights] = useState([])
    const [articles, setArticles] = useState([])
    const [mediaLightbox, setMediaLightbox] = useState(null) // { url, isVideo, post }
    const debugSignatureRef = useRef(null)

    const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId
    const debugTabsMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugTabs") === "1"
    // Determine which user ID to fetch
    const profileUserId = userId || currentUserId

    const fetchProfile = async () => {
        try {
            let fetchedRepliesCount = 0
            let fetchedHighlightsCount = 0
            // First fetch user profile details
            const userData = await userService.getUser(profileUserId)
            setProfile(userData)

            // Prisma: _count.followers = people who follow this user; _count.following = people this user follows
            setFollowerCount(userData._count?.followers ?? 0)
            setFollowingCount(userData._count?.following ?? 0)
            setPostCount(userData._count?.posts ?? 0)


            // Check if current user is following this profile (only if viewing someone else's profile)
            if (currentUserId && profileUserId !== currentUserId) {
                try {
                    const followingListRaw = await userService.getFollowing(currentUserId, { limit: 100 })
                    const followingList = Array.isArray(followingListRaw)
                        ? followingListRaw
                        : (Array.isArray(followingListRaw?.users) ? followingListRaw.users : [])
                    const isCurrentlyFollowing = followingList.some(user => user.id === profileUserId)
                    setIsFollowing(isCurrentlyFollowing)
                } catch (err) {
                    console.error('Failed to check follow status:', err)
                }
            }

            // Then fetch user's posts
            const userPosts = await postService.getPosts({ userId: profileUserId })
            const userPostsList = Array.isArray(userPosts?.posts) ? userPosts.posts : (Array.isArray(userPosts) ? userPosts : [])
            const hydratedPosts = userPostsList.map(post => ({
                ...post,
                user: post.user || userData
            }))
            setPosts(hydratedPosts)
            // If backend count is missing/outdated, fall back to fetched length
            if (!userData._count?.posts) {
                setPostCount(userPostsList.length)
            }

            // Fetch user's replies (posts where replyToId is not null)
            const userReplies = await postService.getPosts({ userId: profileUserId, repliesOnly: true })
            const userRepliesList = Array.isArray(userReplies?.posts) ? userReplies.posts : (Array.isArray(userReplies) ? userReplies : [])
            const hydratedReplies = userRepliesList.map(post => ({
                ...post,
                user: post.user || userData
            }))
            setReplies(hydratedReplies)
            fetchedRepliesCount = userRepliesList.length

            // Fetch posts this user has liked (for Likes tab)
            try {
                const uid = profileUserId && String(profileUserId).trim()
                if (uid) {
                    const likedRes = await postService.getLikedPosts({ userId: uid, limit: 50 })
                    const likedList = Array.isArray(likedRes?.posts) ? likedRes.posts : []
                    const hydratedLiked = likedList.map(post => ({
                        ...post,
                        user: post.user || userData
                    }))
                    setLikedPosts(hydratedLiked)
                } else {
                    setLikedPosts([])
                }
            } catch (likedErr) {
                console.warn('Failed to fetch liked posts:', likedErr?.response?.data || likedErr?.message || likedErr)
                setLikedPosts([])
            }

            // Fetch Highlights
            try {
                const highlightsData = await highlightsService.getHighlights(profileUserId)
                const highlightsList = Array.isArray(highlightsData) ? highlightsData : []
                const hydratedHighlights = highlightsList.map(post => ({
                    ...post,
                    user: post.user || userData
                }))
                setHighlights(hydratedHighlights)
                fetchedHighlightsCount = highlightsList.length
            } catch (hErr) {
                console.warn('Failed to fetch highlights:', hErr)
                setHighlights([])
            }

            // Fetch Articles
            try {
                // For own profile, show drafts too. For others, only published.
                const publishedOnly = profileUserId !== currentUserId
                const articlesData = await articlesService.getArticles(profileUserId, publishedOnly)
                const normalizedArticles = Array.isArray(articlesData) ? articlesData : []
                setArticles(normalizedArticles)

                if (debugTabsMode) {
                    const summary = {
                        userId: profileUserId,
                        posts: userPostsList.length,
                        replies: fetchedRepliesCount,
                        highlights: fetchedHighlightsCount,
                        articles: normalizedArticles.length,
                        publishedOnly,
                    }
                    console.table(summary)
                    const signature = JSON.stringify(summary)
                    if (debugSignatureRef.current !== signature) {
                        debugSignatureRef.current = signature
                        toast.info(
                            `Tabs debug -> replies: ${summary.replies}, highlights: ${summary.highlights}, articles: ${summary.articles}`
                        )
                    }
                }
            } catch (aErr) {
                console.warn('Failed to fetch articles:', aErr)
                setArticles([])
            }
        } catch (err) {
            console.error("Failed to load profile:", err)
            setError("Failed to load profile data")
        } finally {
            setLoading(false)
        }
    }

    const handleFollow = async () => {
        if (followLoading) return

        setFollowLoading(true)
        try {
            if (isFollowing) {
                await userService.unfollowUser(profile.id)
                setIsFollowing(false)
                setFollowerCount(prev => Math.max(0, prev - 1))
            } else {
                await userService.followUser(profile.id)
                setIsFollowing(true)
                setFollowerCount(prev => prev + 1)
            }
        } catch (err) {
            console.error('Follow/unfollow error:', err)
        } finally {
            setFollowLoading(false)
        }
    }

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId)
            setPosts(prev => prev.filter(p => p.id !== postId))
            setReplies(prev => prev.filter(p => p.id !== postId))
            setLikedPosts(prev => prev.filter(p => p.id !== postId))
        } catch (err) {
            console.error('Failed to delete post:', err)
            throw err
        }
    }

    const updatePostInAllTabs = (postId, updater) => {
        const apply = (list) => (Array.isArray(list) ? list.map(p => p.id === postId ? updater(p) : p) : [])
        setPosts(prev => apply(prev))
        setReplies(prev => apply(prev))
        setLikedPosts(prev => apply(prev))
        setHighlights(prev => apply(prev))
    }

    const handleLikePost = async (postId) => {
        const prevPosts = posts
        const prevReplies = replies
        const prevLiked = likedPosts
        updatePostInAllTabs(postId, (p) => ({
            ...p,
            likes: [{ id: 'temp' }],
            _count: { ...p._count, likes: (p._count?.likes || 0) + 1 }
        }))
        try {
            await postService.likePost(postId)
        } catch (err) {
            console.error('Failed to like post:', err)
            setPosts(prevPosts)
            setReplies(prevReplies)
            setLikedPosts(prevLiked)
        }
    }

    const handleUnlikePost = async (postId) => {
        const prevPosts = posts
        const prevReplies = replies
        const prevLiked = likedPosts
        updatePostInAllTabs(postId, (p) => ({
            ...p,
            likes: [],
            _count: { ...p._count, likes: Math.max((p._count?.likes || 0) - 1, 0) }
        }))
        try {
            await postService.unlikePost(postId)
        } catch (err) {
            console.error('Failed to unlike post:', err)
            setPosts(prevPosts)
            setReplies(prevReplies)
            setLikedPosts(prevLiked)
        }
    }

    const handleRetweetPost = async (postId) => {
        const prevPosts = posts
        const prevReplies = replies
        const prevLiked = likedPosts
        updatePostInAllTabs(postId, (p) => ({
            ...p,
            retweets: [{ id: 'temp' }],
            _count: { ...p._count, retweets: (p._count?.retweets || 0) + 1 }
        }))
        try {
            await postService.retweetPost(postId)
        } catch (err) {
            console.error('Failed to retweet post:', err)
            setPosts(prevPosts)
            setReplies(prevReplies)
            setLikedPosts(prevLiked)
        }
    }

    const handleUnretweetPost = async (postId) => {
        const prevPosts = posts
        const prevReplies = replies
        const prevLiked = likedPosts
        updatePostInAllTabs(postId, (p) => ({
            ...p,
            retweets: [],
            _count: { ...p._count, retweets: Math.max((p._count?.retweets || 0) - 1, 0) }
        }))
        try {
            await postService.unretweetPost(postId)
        } catch (err) {
            console.error('Failed to undo retweet:', err)
            setPosts(prevPosts)
            setReplies(prevReplies)
            setLikedPosts(prevLiked)
        }
    }

    const handleBookmarkPost = async (postId) => {
        const prevPosts = posts
        const prevReplies = replies
        const prevLiked = likedPosts
        updatePostInAllTabs(postId, (p) => ({
            ...p,
            bookmarks: [{ id: 'temp' }]
        }))
        try {
            await postService.bookmarkPost(postId)
        } catch (err) {
            console.error('Failed to bookmark post:', err)
            setPosts(prevPosts)
            setReplies(prevReplies)
            setLikedPosts(prevLiked)
        }
    }

    const handleUnbookmarkPost = async (postId) => {
        const prevPosts = posts
        const prevReplies = replies
        const prevLiked = likedPosts
        updatePostInAllTabs(postId, (p) => ({
            ...p,
            bookmarks: []
        }))
        try {
            await postService.unbookmarkPost(postId)
        } catch (err) {
            console.error('Failed to remove bookmark:', err)
            setPosts(prevPosts)
            setReplies(prevReplies)
            setLikedPosts(prevLiked)
        }
    }

    const handleUnlikeLiked = async (postId) => {
        try {
            await postService.unlikePost(postId)
            setLikedPosts(prev => prev.filter(p => p.id !== postId))
        } catch (err) {
            console.error('Failed to unlike post:', err)
        }
    }

    const handleLikeLiked = async (postId) => {
        try {
            await postService.likePost(postId)
            setLikedPosts(prev => prev.map(p => p.id === postId
                ? { ...p, likes: [{ id: 'temp' }], _count: { ...p._count, likes: (p._count?.likes || 0) + 1 } }
                : p))
        } catch (err) {
            console.error('Failed to like post:', err)
        }
    }

    useEffect(() => {
        if (profileUserId) {
            fetchProfile()
        } else if (!authLoading) {
            // Auth ready but no profile to show: /profile with no param and no currentUser.id
            setLoading(false)
            setError("Unable to load profile")
        }
    }, [profileUserId, authLoading])

    const handleProfileUpdate = (updatedProfile) => {
        console.log('ProfilePage: handleProfileUpdate called with', updatedProfile)
        setProfile(prev => ({
            ...prev,
            profile: { ...prev.profile, ...updatedProfile }
        }))
        // Update global auth state so sidebar/header reflect changes
        if (currentUserId === profile.id) {
            console.log('ProfilePage: Updating global auth user')
            updateUser({
                profile: updatedProfile
            })
        }
        // Optionally refresh full data
        fetchProfile()
    }

    const mediaBase = getApiBase() || ''
    const mediaItems = useMemo(() => {
        const list = []
        const allPosts = [...(posts || []), ...(replies || [])]
        for (const post of allPosts) {
            const mediaList = Array.isArray(post?.media) ? post.media : []
            for (const media of mediaList) {
                const raw = media?.mediaUrl
                if (!raw) continue
                const url = raw.startsWith('http') ? raw : `${mediaBase}${raw.startsWith('/') ? '' : '/'}${raw}`
                const urlLower = url.toLowerCase()
                const looksLikeVideo = urlLower.endsWith('.mp4') || urlLower.endsWith('.webm') || urlLower.endsWith('.mov') || urlLower.endsWith('.m4v') ||
                    urlLower.includes('.mp4?') || urlLower.includes('.webm?') || urlLower.includes('.mov?') || urlLower.includes('.m4v?')
                const isVideo = media?.mediaType === 'video' || looksLikeVideo
                list.push({ post, media: { ...media, mediaUrl: url, thumbnailUrl: media.thumbnailUrl ? (media.thumbnailUrl.startsWith('http') ? media.thumbnailUrl : `${mediaBase}${media.thumbnailUrl.startsWith('/') ? '' : '/'}${media.thumbnailUrl}`) : null }, isVideo })
            }
        }
        return list
    }, [posts, replies, mediaBase])

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    if (!profile) {
        const handleRetry = () => {
            if (profileUserId) {
                setError(null)
                setLoading(true)
                fetchProfile()
            }
        }
        return (
            <div className="text-center p-10">
                <p className="text-red-500 mb-4">{error || "Profile not found"}</p>
                {profileUserId && (
                    <Button variant="outline" onClick={handleRetry}>
                        {t('common.retry', 'Retry')}
                    </Button>
                )}
            </div>
        )
    }

    const { profile: userProfile, stats } = profile
    const name = userProfile?.name || profile.name || "User"
    const handle = userProfile?.handle || profile.email?.split('@')[0] || "user"
    const bio = userProfile?.bio || ""
    const location = userProfile?.location || ""
    const website = userProfile?.website || ""
    const gender = userProfile?.gender || ""
    const birthdate = userProfile?.birthdate ? new Date(userProfile.birthdate) : null

    const joinDate = userProfile?.createdAt ? new Date(userProfile.createdAt) : new Date() 
    const avatar = userProfile?.avatar || null
    const banner = userProfile?.banner || null

    return (
        <div>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold leading-5">{name}</h1>
                    <span className="text-[13px] text-muted-foreground">{postCount || 0} {t('profile.posts_count')}</span>
                </div>
            </div>

            {/* Banner & Avatar */}
            <div className="h-[200px] bg-zinc-800 w-full relative">
                {banner && <img src={getMediaUrl(banner)} className="w-full h-full object-cover" />}
            </div>

            <div className="px-4 relative mb-4">
                <div className="flex justify-between items-end -mt-10 mb-3">
                    <Avatar className="w-[134px] h-[134px] border-4 border-background rounded-full">
                        <AvatarImage src={getMediaUrl(avatar)} />
                        <AvatarFallback>{name[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2 pb-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="p-2 border border-border/50 rounded-full hover:bg-muted/50 cursor-pointer transition">
                                    <MoreHorizontal className="w-5 h-5" />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {currentUserId !== profile.id && (
                                    <DropdownMenuItem onClick={() => navigate('/chat', { state: { userId: profile.id, userName: name, userHandle: handle } })}>
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        {t('profile.message_user', { handle })}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {currentUserId === profile.id ? (
                            <EditProfileModal user={profile} onUpdate={handleProfileUpdate}>
                                <Button
                                    variant="outline"
                                    className="rounded-full font-bold h-[36px] border-border hover:bg-white/10"
                                >
                                    {t('profile.edit_profile')}
                                </Button>
                            </EditProfileModal>
                        ) : (
                            <Button
                                variant={isFollowing ? "outline" : "secondary"}
                                className="rounded-full font-bold w-[120px] h-[36px]"
                                onClick={handleFollow}
                                disabled={followLoading}
                            >
                                {followLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : isFollowing ? (
                                    t('common.following')
                                ) : (
                                    t('nav.follow')
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Business Action Layer */}
                {profile.businessProfile && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {profile.businessProfile.website && (
                            <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5" onClick={() => window.open(`https://${profile.businessProfile.website}`, '_blank')}>
                                <ShoppingBag className="w-4 h-4 text-primary" />
                                {t('profile.shop_now', 'Shop Now')}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5" onClick={() => navigate('/chat', { state: { userId: profile.id, userName: name, userHandle: handle } })}>
                            <Mail className="w-4 h-4 text-primary" />
                            {t('profile.contact_us', 'Contact Us')}
                        </Button>
                    </div>
                )}

                {/* User Info */}
                <div className="mb-4">
                    <div className="flex items-center gap-1">
                        <h1 className="text-[20px] font-bold leading-6">{name}</h1>
                        {(userProfile?.verified || profile.businessProfile?.isVerified) && (
                            <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />
                        )}
                        {profile.businessProfile && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 text-[11px] font-bold text-muted-foreground ml-1">
                                <Briefcase className="w-3 h-3" />
                                BUSINESS
                            </div>
                        )}
                    </div>
                    <div className="text-[15px] text-muted-foreground">@{handle}</div>
                </div>

                <div className="text-[15px] leading-5 mb-3 whitespace-pre-wrap">{bio}</div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[15px] text-muted-foreground mb-3">
                    {location && (
                        <div className="flex items-center gap-1">
                            <MapPin className="w-[18px] h-[18px]" />
                            <span>{location}</span>
                        </div>
                    )}
                    {website && (
                        <div className="flex items-center gap-1">
                            <LinkIcon className="w-[18px] h-[18px]" />
                            <a href={`https://${website}`} target="_blank" className="text-primary hover:underline">{website}</a>
                        </div>
                    )}
                    {gender && (
                        <div className="flex items-center gap-1">
                            <User className="w-[18px] h-[18px]" />
                            <span>{gender.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                        </div>
                    )}
                    {birthdate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-[18px] h-[18px]" />
                            <span>{t('profile.birthdate', 'Birth date')}: {birthdate.toLocaleDateString()}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Calendar className="w-[18px] h-[18px]" />
                        <span>{t('profile.joined')} {joinDate.toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Follower/Following Counts - clickable only for own profile (links to /follow) */}
                <div className="flex gap-4 text-[15px] mb-4">
                    <div
                        className={currentUserId === profile.id ? "hover:underline cursor-pointer" : ""}
                        onClick={() => currentUserId === profile.id && navigate('/follow?tab=following')}
                    >
                        <span className="font-bold text-foreground">{followingCount}</span>
                        <span className="text-muted-foreground"> {t('profile.following_count')}</span>
                    </div>
                    <div
                        className={currentUserId === profile.id ? "hover:underline cursor-pointer" : ""}
                        onClick={() => currentUserId === profile.id && navigate('/follow?tab=followers')}
                    >
                        <span className="font-bold text-foreground">{followerCount}</span>
                        <span className="text-muted-foreground"> {t('profile.followers_count')}</span>
                    </div>
                </div>
            </div>


            {/* Tabs */}
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full h-[53px] bg-transparent border-b border-border/50 p-0 overflow-x-auto justify-between no-scrollbar">
                    {[
                        "posts", "replies", "highlights", "articles", "media", "likes",
                        ...(profile.businessProfile ? ["products", "reviews"] : [])
                    ].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase()}
                            className="flex-1 rounded-none border-b-[4px] border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-[15px] hover:bg-muted/50 transition font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold"
                        >
                            {t(`profile.tabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="posts" className="mt-0">
                    {currentUserId === profile.id && <SetupProgress />}
                    <div className="divide-y divide-border/50">
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handleDeletePost}
                                onLike={handleLikePost}
                                onUnlike={handleUnlikePost}
                                onRetweet={handleRetweetPost}
                                onUnretweet={handleUnretweetPost}
                                onBookmark={handleBookmarkPost}
                                onUnbookmark={handleUnbookmarkPost}
                            />
                        ))}
                        {posts.length === 0 && <div className="p-8 text-center text-muted-foreground">{t('feed.no_posts_yet')}</div>}
                    </div>
                </TabsContent>

                <TabsContent value="replies" className="mt-0">
                    <div className="divide-y divide-border/50">
                        {replies.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handleDeletePost}
                                onLike={handleLikePost}
                                onUnlike={handleUnlikePost}
                                onRetweet={handleRetweetPost}
                                onUnretweet={handleUnretweetPost}
                                onBookmark={handleBookmarkPost}
                                onUnbookmark={handleUnbookmarkPost}
                            />
                        ))}
                        {replies.length === 0 && <div className="p-8 text-center text-muted-foreground">{t('profile.no_replies')}</div>}
                    </div>
                </TabsContent>

                <TabsContent value="highlights" className="mt-0">
                    <div className="divide-y divide-border/50">
                        {highlights.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handleDeletePost}
                                onLike={handleLikePost}
                                onUnlike={handleUnlikePost}
                                onRetweet={handleRetweetPost}
                                onUnretweet={handleUnretweetPost}
                                onBookmark={handleBookmarkPost}
                                onUnbookmark={handleUnbookmarkPost}
                                onToggleHighlight={(postId, isNowHighlighted) => {
                                    if (!isNowHighlighted) {
                                        setHighlights(prev => prev.filter(p => p.id !== postId));
                                    }
                                }}
                            />
                        ))}
                        {highlights.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                {profile.id === currentUserId 
                                    ? "Showcase your best posts here by adding them to your highlights."
                                    : "No highlights to show yet."
                                }
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="articles" className="mt-0">
                    <div className="flex flex-col">
                        {currentUserId === profile.id && (
                             <div className="p-4 flex justify-center border-b border-border/50">
                                 <Button variant="outline" onClick={() => navigate('/articles/new')} className="rounded-full font-bold min-w-[200px]">
                                     Write an Article
                                 </Button>
                             </div>
                        )}
                        
                        <div className="divide-y divide-border/50">
                            {articles.map(article => (
                                <div 
                                    key={article.id} 
                                    className="p-4 hover:bg-muted/30 cursor-pointer transition border-b border-border/50" 
                                    onClick={() => navigate(`/article/${article.id}`)}
                                >
                                    {article.coverImage && (
                                        <img src={getMediaUrl(article.coverImage)} className="w-full h-48 object-cover rounded-xl mb-3" />
                                    )}
                                    <h2 className="text-xl font-bold mb-1">{article.title}</h2>
                                    <p className="text-muted-foreground line-clamp-3 mb-2">{article.content.substring(0, 200).replace(/[#*]/g, '')}...</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                        {!article.isPublished && <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full text-xs">Draft</span>}
                                    </div>
                                </div>
                            ))}
                            {articles.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    {profile.id === currentUserId 
                                        ? "Share your thoughts in long-form articles."
                                        : "No articles published yet."
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="media" className="mt-0">
                    {mediaItems.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">{t('profile.no_media', 'No media yet')}</div>
                    ) : (
                        <div className="grid grid-cols-3 gap-0.5 p-1">
                            {mediaItems.map((item, index) => {
                                const { media, isVideo } = item
                                const url = media.mediaUrl
                                const thumb = media.thumbnailUrl || url
                                return (
                                    <button
                                        key={`${item.post.id}-${media.id ?? index}`}
                                        type="button"
                                        className="relative aspect-square bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                                        onClick={() => setMediaLightbox({ url, isVideo, post: item.post })}
                                    >
                                        {isVideo ? (
                                            <>
                                                <video
                                                    src={url}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                    poster={thumb}
                                                />
                                                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <Play className="w-10 h-10 text-white fill-white" />
                                                </span>
                                            </>
                                        ) : (
                                            <img
                                                src={url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="likes" className="mt-0">
                    <div className="divide-y divide-border/50">
                        {likedPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onDelete={handleDeletePost}
                                onLike={handleLikeLiked}
                                onUnlike={handleUnlikeLiked}
                                onRetweet={handleRetweetPost}
                                onUnretweet={handleUnretweetPost}
                                onBookmark={handleBookmarkPost}
                                onUnbookmark={handleUnbookmarkPost}
                            />
                        ))}
                        {likedPosts.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">{t('profile.no_likes', 'No likes yet')}</div>
                        )}
                    </div>
                </TabsContent>

                {profile.businessProfile && (
                    <BusinessProfileView 
                        profile={profile} 
                        currentUser={currentUser}
                    />
                )}
            </Tabs>

            {/* Media lightbox */}
            <Dialog open={!!mediaLightbox} onOpenChange={(open) => !open && setMediaLightbox(null)}>
                <DialogContent className="max-w-[95vw] max-h-[90vh] w-auto p-0 bg-black/95 border-border overflow-hidden" onPointerDownOutside={() => setMediaLightbox(null)}>
                    {mediaLightbox && (
                        mediaLightbox.isVideo ? (
                            <video src={mediaLightbox.url} controls className="w-full max-h-[90vh] object-contain" autoPlay playsInline />
                        ) : (
                            <img src={mediaLightbox.url} alt="" className="w-full max-h-[90vh] object-contain" />
                        )
                    )}
                </DialogContent>
            </Dialog>
        </div >
    )
}
