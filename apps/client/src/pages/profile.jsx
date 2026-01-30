import { ArrowLeft, MoreHorizontal, Calendar, Link as LinkIcon, MapPin, Mail, Loader2, MessageCircle } from "lucide-react"
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

export default function Profile() {
    const navigate = useNavigate()
    const { userId } = useParams() // Get userId from URL
    const { user: currentUser, updateUser } = useAuth()
    const [profile, setProfile] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    const [followerCount, setFollowerCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)
    const [replies, setReplies] = useState([])

    // Determine which user ID to fetch
    const profileUserId = userId || currentUser?.id

    const fetchProfile = async () => {
        try {
            // First fetch user profile details
            const userData = await userService.getUser(profileUserId)
            setProfile(userData)

            // Set follower/following counts (backend returns them swapped)
            setFollowerCount(userData._count?.following || 0)  // backend's 'following' is actually followers
            setFollowingCount(userData._count?.followers || 0)  // backend's 'followers' is actually following


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
            setPosts(userPosts.posts)

            // Fetch user's replies (posts where replyToId is not null)
            const userReplies = await postService.getPosts({ userId: profileUserId, repliesOnly: true })
            setReplies(userReplies.posts)
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

    useEffect(() => {
        if (profileUserId) {
            fetchProfile()
        }
    }, [profileUserId]) // Refetch when userId changes

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

    if (!profile) return <div className="text-center p-10 text-red-500">Profile not found</div>

    const { profile: userProfile, stats } = profile
    const name = userProfile?.name || profile.name || "User"
    const handle = userProfile?.handle || profile.email?.split('@')[0] || "user"
    const bio = userProfile?.bio || ""
    const location = userProfile?.location || ""
    const website = userProfile?.website || ""
    const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const avatar = userProfile?.avatar || "/websplash.png"
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
                    <span className="text-[13px] text-muted-foreground">{stats?.posts || 0} posts</span>
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
                                        Message @{handle}
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
                                    Edit profile
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
                                    "Following"
                                ) : (
                                    "Follow"
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
                            <svg viewBox="0 0 22 22" aria-label="Verified account" role="img" className="w-[18px] h-[18px] fill-blue-500" data-testid="icon-verified"><g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.687.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path></g></svg>
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
                    <div className="flex items-center gap-1">
                        <Calendar className="w-[18px] h-[18px]" />
                        <span>Joined {joinDate}</span>
                    </div>
                </div>

                {/* Follower/Following Counts */}
                <div className="flex gap-4 text-[15px] mb-4">
                    <div
                        className="hover:underline cursor-pointer"
                        onClick={() => navigate('/follow')}
                    >
                        <span className="font-bold text-foreground">{followingCount}</span>
                        <span className="text-muted-foreground"> Following</span>
                    </div>
                    <div
                        className="hover:underline cursor-pointer"
                        onClick={() => navigate('/follow')}
                    >
                        <span className="font-bold text-foreground">{followerCount}</span>
                        <span className="text-muted-foreground"> Followers</span>
                    </div>
                </div>
            </div>


            {/* Tabs */}
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full h-[53px] bg-transparent border-b border-border/50 p-0 overflow-x-auto justify-between no-scrollbar">
                    {["Posts", "Replies", "Highlights", "Articles", "Media", "Likes"].map(tab => (
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
                    {currentUser?.id === profile.id && <SetupProgress />}
                    <div className="divide-y divide-border/50">
                        {posts.map(post => <PostCard key={post.id} post={post} />)}
                        {posts.length === 0 && <div className="p-8 text-center text-muted-foreground">No posts yet</div>}
                    </div>
                </TabsContent>

                <TabsContent value="replies" className="mt-0">
                    <div className="divide-y divide-border/50">
                        {replies.map(post => <PostCard key={post.id} post={post} />)}
                        {replies.length === 0 && <div className="p-8 text-center text-muted-foreground">No replies yet</div>}
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
