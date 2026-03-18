import { ArrowLeft, MoreHorizontal, Calendar, Link as LinkIcon, MapPin, Mail, Loader2, MessageCircle, BadgeCheck, User } from "lucide-react"
import { toast } from "sonner"
import { useNavigate, useParams } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/post-card"
import { useState, useEffect } from "react"
import { cn, getMediaUrl } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { userService, postService } from "@/services/api"
import { EditProfileModal } from "@/components/profile/edit-profile-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SetupProgress } from "@/components/profile/setup-progress"

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

    // Determine which user ID to fetch
    const profileUserId = userId || currentUser?.id

    const fetchProfile = async () => {
        try {
            // First fetch user profile details
            const userData = await userService.getUser(profileUserId)
            setProfile(userData)

            // Prisma: _count.followers = people who follow this user; _count.following = people this user follows
            setFollowerCount(userData._count?.followers ?? 0)
            setFollowingCount(userData._count?.following ?? 0)
            setPostCount(userData._count?.posts ?? 0)


            // Check if current user is following this profile (only if viewing someone else's profile)
            if (currentUser?.id && profileUserId !== currentUser.id) {
                try {
                    const followingList = await userService.getFollowing(currentUser.id, { limit: 100 })
                    const isCurrentlyFollowing = followingList.some(user => user.id === profileUserId)
                    setIsFollowing(isCurrentlyFollowing)
                } catch (err) {
                    console.error('Failed to check follow status:', err)
                }
            }

            // Then fetch user's posts
            const userPosts = await postService.getPosts({ userId: profileUserId })
            const hydratedPosts = userPosts.posts.map(post => ({
                ...post,
                user: post.user || userData
            }))
            setPosts(hydratedPosts)
            // If backend count is missing/outdated, fall back to fetched length
            if (!userData._count?.posts && Array.isArray(userPosts?.posts)) {
                setPostCount(userPosts.posts.length)
            }

            // Fetch user's replies (posts where replyToId is not null)
            const userReplies = await postService.getPosts({ userId: profileUserId, repliesOnly: true })
            const hydratedReplies = userReplies.posts.map(post => ({
                ...post,
                user: post.user || userData
            }))
            setReplies(hydratedReplies)
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
            // Update stats if needed, or rely on refetch
        } catch (err) {
            console.error('Failed to delete post:', err)
            throw err // Re-throw so the dropdown knows it failed
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
        if (currentUser?.id === profile.id) {
            console.log('ProfilePage: Updating global auth user')
            updateUser({
                profile: updatedProfile
            })
        }
        // Optionally refresh full data
        fetchProfile()
    }

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
                                {currentUser?.id !== profile.id && (
                                    <DropdownMenuItem onClick={() => navigate('/chat', { state: { userId: profile.id, userName: name, userHandle: handle } })}>
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        {t('profile.message_user', { handle })}
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {currentUser?.id === profile.id ? (
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

                {/* User Info */}
                <div className="mb-4">
                    <div className="flex items-center gap-1">
                        <h1 className="text-[20px] font-bold leading-6">{name}</h1>
                        {userProfile?.verified && (
                            <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />
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
                        className={currentUser?.id === profile.id ? "hover:underline cursor-pointer" : ""}
                        onClick={() => currentUser?.id === profile.id && navigate('/follow?tab=following')}
                    >
                        <span className="font-bold text-foreground">{followingCount}</span>
                        <span className="text-muted-foreground"> {t('profile.following_count')}</span>
                    </div>
                    <div
                        className={currentUser?.id === profile.id ? "hover:underline cursor-pointer" : ""}
                        onClick={() => currentUser?.id === profile.id && navigate('/follow?tab=followers')}
                    >
                        <span className="font-bold text-foreground">{followerCount}</span>
                        <span className="text-muted-foreground"> {t('profile.followers_count')}</span>
                    </div>
                </div>
            </div>


            {/* Tabs */}
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full h-[53px] bg-transparent border-b border-border/50 p-0 overflow-x-auto justify-between no-scrollbar">
                    {["posts", "replies", "highlights", "articles", "media", "likes"].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase()}
                            className="flex-1 rounded-none border-b-[4px] border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent h-full text-[15px] hover:bg-muted/50 transition font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold"
                        >
                            {t(`profile.tabs.${tab}`)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="posts" className="mt-0">
                    {currentUser?.id === profile.id && <SetupProgress />}
                    <div className="divide-y divide-border/50">
                        {posts.map(post => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)}
                        {posts.length === 0 && <div className="p-8 text-center text-muted-foreground">{t('feed.no_posts_yet')}</div>}
                    </div>
                </TabsContent>

                <TabsContent value="replies" className="mt-0">
                    <div className="divide-y divide-border/50">
                        {replies.map(post => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)}
                        {replies.length === 0 && <div className="p-8 text-center text-muted-foreground">{t('profile.no_replies')}</div>}
                    </div>
                </TabsContent>

                <TabsContent value="highlights" className="mt-0">
                    <div className="p-8 text-center text-muted-foreground">No highlights yet</div>
                </TabsContent>

                <TabsContent value="articles" className="mt-0">
                    <div className="p-8 text-center text-muted-foreground">No articles yet</div>
                </TabsContent>

                <TabsContent value="media" className="mt-0">
                    <div className="p-8 text-center text-muted-foreground">No media yet</div>
                </TabsContent>

                <TabsContent value="likes" className="mt-0">
                    <div className="p-8 text-center text-muted-foreground">No likes yet</div>
                </TabsContent>
            </Tabs>
        </div >
    )
}
