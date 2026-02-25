
import { useParams } from "react-router-dom"
import { BarChart, Video, Calendar, Users, ArrowLeft, Heart, Repeat2, MessageCircle, Share, Bookmark, Upload, X, Feather, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function PageHeader({ title, description, icon: Icon }) {
    const navigate = useNavigate()
    return (
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary" />}
                    {title}
                </h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        </div>
    )
}

export function Analytics() {
    return (
        <div>
            <PageHeader title="Analytics" description="Overview of your performance" icon={BarChart} />
            <div className="p-4 space-y-6">
                {/* 28 Day Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Impressions</div>
                        <div className="text-2xl font-bold">2.4M</div>
                        <div className="text-xs text-green-500 mt-1">↑ 12.5%</div>
                    </div>
                    <div className="bg-black border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Engagements</div>
                        <div className="text-2xl font-bold">145K</div>
                        <div className="text-xs text-green-500 mt-1">↑ 8.2%</div>
                    </div>
                    <div className="bg-black border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Profile Visits</div>
                        <div className="text-2xl font-bold">12K</div>
                        <div className="text-xs text-red-500 mt-1">↓ 2.1%</div>
                    </div>
                </div>

                {/* Mock Chart Area */}
                <div className="bg-black border border-border rounded-xl p-6">
                    <h3 className="font-bold mb-4">Activity (28 Days)</h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {Array.from({ length: 14 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-full bg-[rgb(29,155,240)]/20 rounded-t-sm hover:bg-[rgb(29,155,240)]/50 transition-colors"
                                style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Top Tweets */}
                <div>
                    <h3 className="font-bold mb-3">Top Posts</h3>
                    <div className="space-y-3">
                        <div className="bg-black border border-border rounded-xl p-4 flex justify-between items-center">
                            <p className="text-sm line-clamp-1 flex-1">Just launched the new feature! Check it out...</p>
                            <div className="text-xs text-muted-foreground ml-4">45K Impressions</div>
                        </div>
                        <div className="bg-black border border-border rounded-xl p-4 flex justify-between items-center">
                            <p className="text-sm line-clamp-1 flex-1">Here is a quick tutorial on React Server Components...</p>
                            <div className="text-xs text-muted-foreground ml-4">32K Impressions</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MediaLibrary() {
    const [uploadOpen, setUploadOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState(null)
    const [mediaItems, setMediaItems] = useState([
        { id: 1, type: 'JPG', gradient: 'from-pink-500/20 to-purple-500/20', name: 'design-mockup.jpg', size: '2.4 MB', date: 'Jan 15, 2026' },
        { id: 2, type: 'MP4', gradient: 'from-blue-500/20 to-cyan-500/20', name: 'product-demo.mp4', size: '15.8 MB', date: 'Jan 14, 2026' },
        { id: 3, type: 'JPG', gradient: 'from-orange-500/20 to-yellow-500/20', name: 'team-photo.jpg', size: '3.1 MB', date: 'Jan 12, 2026' },
        { id: 4, type: 'JPG', gradient: 'from-pink-500/20 to-purple-500/20', name: 'screenshot.jpg', size: '1.8 MB', date: 'Jan 10, 2026' },
        { id: 5, type: 'MP4', gradient: 'from-blue-500/20 to-cyan-500/20', name: 'tutorial.mp4', size: '22.3 MB', date: 'Jan 8, 2026' },
        { id: 6, type: 'JPG', gradient: 'from-orange-500/20 to-yellow-500/20', name: 'banner.jpg', size: '4.2 MB', date: 'Jan 5, 2026' },
        { id: 7, type: 'JPG', gradient: 'from-pink-500/20 to-purple-500/20', name: 'logo-variants.jpg', size: '1.2 MB', date: 'Jan 3, 2026' },
        { id: 8, type: 'MP4', gradient: 'from-blue-500/20 to-cyan-500/20', name: 'animation.mp4', size: '8.7 MB', date: 'Jan 1, 2026' }
    ])

    const handleUpload = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            const newMedia = {
                id: mediaItems.length + 1,
                type: file.type.includes('video') ? 'MP4' : 'JPG',
                gradient: 'from-green-500/20 to-emerald-500/20',
                name: file.name,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
            setMediaItems([newMedia, ...mediaItems])
            setUploadOpen(false)
        }
    }

    const handleView = (media) => {
        setSelectedMedia(media)
        setViewOpen(true)
    }

    const handleDelete = (id) => {
        setMediaItems(mediaItems.filter(item => item.id !== id))
        setViewOpen(false)
    }

    return (
        <div>
            <PageHeader title="Media Studio" description={`${(mediaItems.length * 3.2).toFixed(1)}GB of 15GB used`} icon={Video} />
            <div className="sticky top-0 z-10 border-b border-border px-4 py-3 flex items-center justify-end bg-background/50">
                <Button size="sm" className="rounded-full font-bold" onClick={() => setUploadOpen(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                </Button>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaItems.map((media) => (
                        <div
                            key={media.id}
                            className="aspect-square bg-muted rounded-xl overflow-hidden relative group cursor-pointer border border-border/50"
                            onClick={() => handleView(media)}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${media.gradient}`} />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">View</span>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                <span className="text-[10px] bg-black/60 px-1.5 rounded text-white backdrop-blur-md">
                                    {media.type}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upload Dialog */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="bg-black border-border">
                    <DialogHeader>
                        <DialogTitle>Upload Media</DialogTitle>
                        <DialogDescription>
                            Upload images or videos to your media library
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-4">
                                Click to select or drag and drop
                            </p>
                            <Input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleUpload}
                                className="cursor-pointer"
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Supported formats: JPG, PNG, GIF, MP4, MOV (Max 100MB)
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="bg-black border-border max-w-2xl">
                    {selectedMedia && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedMedia.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                {/* Media Preview */}
                                <div className={`aspect-video rounded-lg bg-gradient-to-br ${selectedMedia.gradient} flex items-center justify-center`}>
                                    <span className="text-6xl opacity-20">{selectedMedia.type === 'MP4' ? '▶' : '🖼'}</span>
                                </div>

                                {/* Media Info */}
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground mb-1">Type</div>
                                        <div className="font-medium">{selectedMedia.type}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Size</div>
                                        <div className="font-medium">{selectedMedia.size}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Uploaded</div>
                                        <div className="font-medium">{selectedMedia.date}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1">
                                        Download
                                    </Button>
                                    <Button variant="outline" className="flex-1">
                                        Copy Link
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleDelete(selectedMedia.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export function ScheduledPosts() {
    const [posts, setPosts] = useState([
        { id: 1, text: "Just recorded a new podcast episode! 🎙️ #tech", date: "Tomorrow, 10:00 AM" },
        { id: 2, text: "What's everyone building this weekend?", date: "Oct 24, 2:00 PM" },
        { id: 3, text: "Thread: 5 tips for better React performance 🧵", date: "Oct 25, 9:30 AM" }
    ])
    const [createOpen, setCreateOpen] = useState(false)
    const [newPostText, setNewPostText] = useState("")
    const [newPostDate, setNewPostDate] = useState("")

    const handleCreatePost = (e) => {
        e.preventDefault()
        console.log("Attempting to schedule post:", { text: newPostText, date: newPostDate })
        if (!newPostText.trim() || !newPostDate) {
            console.error("Missing text or date")
            return
        }

        const newPost = {
            id: Date.now(),
            text: newPostText,
            date: new Date(newPostDate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        }

        setPosts([newPost, ...posts])
        setNewPostText("")
        setNewPostDate("")
        setCreateOpen(false)
        console.log("Post scheduled successfully")
    }

    return (
        <div className="flex flex-col h-full bg-black">
            <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <PageHeader title="Scheduled Posts" description={`${posts.length} posts queued`} icon={Calendar} />
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button
                            id="create-new-scheduled-post"
                            size="sm"
                            className="rounded-full font-bold bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            Create New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-border sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Schedule a Post</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Draft your post and select a time to publish it.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Post Content</label>
                                <textarea
                                    id="scheduled-post-textarea"
                                    className="w-full min-h-[140px] bg-zinc-900/50 border border-border rounded-2xl p-4 text-[15px] focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none text-white placeholder:text-muted-foreground"
                                    placeholder="What's happening?"
                                    value={newPostText}
                                    onChange={(e) => {
                                        console.log("Text updated:", e.target.value)
                                        setNewPostText(e.target.value)
                                    }}
                                />
                                <div className="text-[11px] text-muted-foreground text-right tabular-nums">{newPostText.length}/280</div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Schedule Date & Time</label>
                                <Input
                                    id="scheduled-post-date"
                                    type="datetime-local"
                                    className="bg-zinc-900/50 border-border h-12 rounded-xl text-white appearance-none"
                                    value={newPostDate}
                                    onChange={(e) => {
                                        console.log("Date updated:", e.target.value)
                                        setNewPostDate(e.target.value)
                                    }}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                            <div className="pt-6 flex gap-3">
                                <Button
                                    variant="ghost"
                                    className="flex-1 rounded-full text-muted-foreground hover:text-white hover:bg-white/5 h-11 font-bold"
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    id="schedule-submit-button"
                                    onClick={handleCreatePost}
                                    className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold h-11 shadow-lg shadow-blue-500/20"
                                    disabled={!newPostText.trim() || !newPostDate}
                                >
                                    Schedule
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="divide-y divide-border">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <div key={post.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0 border border-white/5 flex items-center justify-center">
                                    <Feather className="w-5 h-5 text-blue-400 opacity-50" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Scheduled for {post.date}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-3 rounded-full">Edit</Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setPosts(posts.filter(p => p.id !== post.id))}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[15px] leading-relaxed pr-8">{post.text}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No scheduled posts</h3>
                        <p className="text-muted-foreground max-w-[300px]">
                            When you schedule posts, they'll show up here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export function AudienceInsights() {
    return (
        <div>
            <PageHeader title="Audience Insights" description="Know your community" icon={Users} />

            <div className="p-4 space-y-6">
                {/* Top Interests */}
                <div className="bg-black border border-border rounded-xl p-6">
                    <h3 className="font-bold mb-4">Top Interests</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Technology", value: 85 },
                            { label: "Web Development", value: 72 },
                            { label: "Design", value: 64 },
                            { label: "Startups", value: 58 },
                            { label: "Crypto", value: 45 }
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{item.label}</span>
                                    <span className="text-muted-foreground">{item.value}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-2">Gender</h3>
                        <div className="flex items-end gap-2 h-32 mt-4">
                            <div className="w-1/2 bg-blue-500/20 h-[65%] rounded-t relative group">
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold">65%</div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Male</div>
                            </div>
                            <div className="w-1/2 bg-pink-500/20 h-[35%] rounded-t relative group">
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold">35%</div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Female</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-2">Top Locations</h3>
                        <div className="space-y-3 mt-4">
                            {[
                                { country: "United States", pct: "42%" },
                                { country: "India", pct: "18%" },
                                { country: "United Kingdom", pct: "12%" }
                            ].map((loc, i) => (
                                <div key={i} className="flex justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                                    <span>{loc.country}</span>
                                    <span className="font-bold text-muted-foreground">{loc.pct}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function PostDetail() {
    const { id } = useParams()
    const [liked, setLiked] = useState(false)
    const [reposted, setReposted] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)

    // Mock post data
    const post = {
        author: {
            name: "Sarah Chen",
            username: "@sarahchen",
            avatar: "SC",
            verified: true
        },
        content: "Just shipped a major update to our design system! 🎨✨\n\nKey improvements:\n• New color tokens for better accessibility\n• Refined spacing scale\n• Updated component variants\n• Comprehensive documentation\n\nCheck it out and let me know what you think! #DesignSystems #UI",
        timestamp: "2h ago",
        stats: {
            replies: 24,
            reposts: 156,
            likes: 892,
            bookmarks: 67
        }
    }

    const replies = [
        { author: "Alex Rivera", username: "@alexr", avatar: "AR", text: "This looks amazing! The new color system is so much more intuitive.", time: "1h ago" },
        { author: "Jamie Lee", username: "@jamielee", avatar: "JL", text: "Love the documentation updates. Makes it so much easier to onboard new designers!", time: "45m ago" }
    ]

    return (
        <div>
            <PageHeader title="Post" />

            {/* Main Post */}
            <div className="border-b border-border">
                <div className="p-4">
                    {/* Author Info */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {post.author.avatar}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold hover:underline cursor-pointer">{post.author.name}</span>
                                {post.author.verified && (
                                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">{post.author.username}</div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="text-[15px] leading-normal whitespace-pre-wrap mb-4">
                        {post.content}
                    </div>

                    {/* Timestamp */}
                    <div className="text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                        {post.timestamp} · Post #{id}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 py-4 border-b border-border text-sm">
                        <div><span className="font-bold">{post.stats.reposts}</span> <span className="text-muted-foreground">Reposts</span></div>
                        <div><span className="font-bold">{post.stats.likes}</span> <span className="text-muted-foreground">Likes</span></div>
                        <div><span className="font-bold">{post.stats.bookmarks}</span> <span className="text-muted-foreground">Bookmarks</span></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-around py-2 border-b border-border">
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{post.stats.replies}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-2 transition-colors ${reposted ? 'text-green-500' : 'hover:text-green-500'}`}
                            onClick={() => setReposted(!reposted)}
                        >
                            <Repeat2 className="w-5 h-5" />
                            <span className="text-sm">{post.stats.reposts + (reposted ? 1 : 0)}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-2 transition-colors ${liked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                            onClick={() => setLiked(!liked)}
                        >
                            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.stats.likes + (liked ? 1 : 0)}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`flex items-center gap-2 transition-colors ${bookmarked ? 'text-blue-500' : 'hover:text-blue-500'}`}
                            onClick={() => setBookmarked(!bookmarked)}
                        >
                            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:text-blue-500 transition-colors">
                            <Share className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Replies */}
            <div>
                <div className="p-4 border-b border-border">
                    <h3 className="font-bold text-lg">Replies</h3>
                </div>
                {replies.map((reply, i) => (
                    <div key={i} className="p-4 border-b border-border hover:bg-white/[0.02] transition-colors">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {reply.avatar}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm hover:underline cursor-pointer">{reply.author}</span>
                                    <span className="text-muted-foreground text-sm">{reply.username}</span>
                                    <span className="text-muted-foreground text-sm">· {reply.time}</span>
                                </div>
                                <p className="text-[15px]">{reply.text}</p>
                                <div className="flex gap-12 mt-2 text-muted-foreground">
                                    <button className="hover:text-blue-500 transition-colors flex items-center gap-1">
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                    <button className="hover:text-pink-500 transition-colors flex items-center gap-1">
                                        <Heart className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
