
import { useParams, Link } from "react-router-dom"
import { useEffect, useCallback } from "react"
import { BarChart, Video, Calendar, Users, ArrowLeft, Heart, Repeat2, MessageCircle, Share, Bookmark, Upload, X, Feather, BadgeCheck, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PostCard } from "@/components/feed/post-card"
import { postService, mediaService, analyticsService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { io } from "socket.io-client"

// Use '' for same-origin when unset (works via IP - Vite proxies /api)
const API_URL = import.meta.env.VITE_API_URL || ''
import { usePosts } from "@/hooks/usePosts"
import { toast } from "sonner"

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

function formatCount(n) {
    const num = Number(n)
    if (isNaN(num)) return '0'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return String(num)
}

function formatGrowth(growth) {
    const n = Number(growth)
    if (isNaN(n) || n === 0) return '+0%'
    const sign = n > 0 ? '+' : ''
    return `${sign}${n}%`
}

export function Analytics() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        impressions: 0,
        engagements: 0,
        profileVisits: 0,
        impressionsGrowth: 0,
        engagementsGrowth: 0,
        profileVisitsGrowth: 0
    })
    const [topPosts, setTopPosts] = useState([])
    const [activityData, setActivityData] = useState([])

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user?.id) {
                setLoading(false)
                setStats({ impressions: 0, engagements: 0, profileVisits: 0, impressionsGrowth: 0, engagementsGrowth: 0, profileVisitsGrowth: 0 })
                setTopPosts([])
                setActivityData(Array(14).fill(0).map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (13 - i))
                    return { date: d.toISOString().slice(0, 10), count: 0, pct: 0 }
                }))
                return
            }
            setLoading(true)
            try {
                const [creatorStats, postsData] = await Promise.all([
                    analyticsService.getCreatorStats().catch(() => null),
                    postService.getPosts({ userId: user.id, limit: 50 }).catch(() => ({}))
                ])

                if (creatorStats) {
                    const v = creatorStats.views?.total ?? 0
                    const f = creatorStats.followers?.total ?? 0
                    setStats({
                        impressions: v,
                        engagements: v,
                        profileVisits: f,
                        impressionsGrowth: creatorStats.views?.growth ?? 0,
                        engagementsGrowth: creatorStats.views?.growth ?? 0,
                        profileVisitsGrowth: creatorStats.followers?.growth ?? 0
                    })
                }

                const posts = postsData?.posts ?? postsData ?? []
                const withEngagement = posts.filter((p) => !p.replyToId).map((p) => {
                    const c = p._count || {}
                    const eng = (c.likes ?? 0) + (c.retweets ?? 0) + (c.replies ?? 0)
                    return { ...p, _engagement: eng }
                })
                const sorted = withEngagement.sort((a, b) => (b._engagement ?? 0) - (a._engagement ?? 0))
                setTopPosts(sorted.slice(0, 5))

                const now = new Date()
                const dayBuckets = Array(14).fill(0).map((_, i) => {
                    const d = new Date(now)
                    d.setDate(d.getDate() - (13 - i))
                    return { date: d.toISOString().slice(0, 10), count: 0 }
                })
                posts.forEach((p) => {
                    const d = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : null
                    if (d) {
                        const b = dayBuckets.find((x) => x.date === d)
                        if (b) b.count += 1
                    }
                })
                const maxCount = Math.max(1, ...dayBuckets.map((x) => x.count))
                setActivityData(dayBuckets.map((x) => ({ ...x, pct: maxCount > 0 ? (x.count / maxCount) * 100 : 0 })))
            } catch (err) {
                console.error('Analytics fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [user?.id])

    if (loading) {
        return (
            <div>
                <PageHeader title="Analytics" description="Overview of your performance" icon={BarChart} />
                <div className="p-8 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div>
            <PageHeader title="Analytics" description="Overview of your performance" icon={BarChart} />
            <div className="p-4 space-y-6">
                {/* 28 Day Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Impressions</div>
                        <div className="text-2xl font-bold">{formatCount(stats.impressions)}</div>
                        <div className={`text-xs mt-1 ${stats.impressionsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.impressionsGrowth >= 0 ? '↑' : '↓'} {formatGrowth(Math.abs(stats.impressionsGrowth))}
                        </div>
                    </div>
                    <div className="bg-black border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Engagements</div>
                        <div className="text-2xl font-bold">{formatCount(stats.engagements)}</div>
                        <div className={`text-xs mt-1 ${stats.engagementsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.engagementsGrowth >= 0 ? '↑' : '↓'} {formatGrowth(Math.abs(stats.engagementsGrowth))}
                        </div>
                    </div>
                    <div className="bg-black border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground mb-1">Profile Visits</div>
                        <div className="text-2xl font-bold">{formatCount(stats.profileVisits)}</div>
                        <div className={`text-xs mt-1 ${stats.profileVisitsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.profileVisitsGrowth >= 0 ? '↑' : '↓'} {formatGrowth(Math.abs(stats.profileVisitsGrowth))}
                        </div>
                    </div>
                </div>

                {/* Activity Chart (28 Days) */}
                <div className="bg-black border border-border rounded-xl p-6">
                    <h3 className="font-bold mb-4">Activity (14 Days)</h3>
                    <div className="h-48 flex items-end justify-between gap-2">
                        {activityData.map((d, i) => (
                            <div
                                key={i}
                                className="w-full bg-[rgb(29,155,240)]/20 rounded-t-sm hover:bg-[rgb(29,155,240)]/50 transition-colors flex flex-col justify-end"
                                style={{ height: `${Math.max(12, d.pct)}%` }}
                                title={`${d.date}: ${d.count} post${d.count !== 1 ? 's' : ''}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                        <span>{activityData[0]?.date ?? ''}</span>
                        <span>{activityData[activityData.length - 1]?.date ?? ''}</span>
                    </div>
                </div>

                {/* Top Posts */}
                <div>
                    <h3 className="font-bold mb-3">Top Posts</h3>
                    {topPosts.length > 0 ? (
                        <div className="space-y-3">
                            {topPosts.map((post) => {
                                const c = post._count || {}
                                const eng = (c.likes ?? 0) + (c.retweets ?? 0) + (c.replies ?? 0)
                                return (
                                    <Link
                                        key={post.id}
                                        to={`/post/${post.id}`}
                                        className="block bg-black border border-border rounded-xl p-4 flex justify-between items-center hover:bg-white/[0.03] transition-colors"
                                    >
                                        <p className="text-sm line-clamp-1 flex-1">{post.content || '(No content)'}</p>
                                        <div className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
                                            {formatCount(eng)} Engagements
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="bg-black border border-border rounded-xl p-8 text-center text-muted-foreground">
                            No posts yet. Create posts to see your top performers here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export function MediaLibrary() {
    const [uploadOpen, setUploadOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [selectedMedia, setSelectedMedia] = useState(null)
    const [mediaItems, setMediaItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const items = await mediaService.getLibrary()
                setMediaItems(Array.isArray(items) ? items : [])
            } catch (err) {
                console.error("Failed to load media library:", err)
                toast.error("Failed to load media library")
            } finally {
                setLoading(false)
            }
        }
        fetchLibrary()
    }, [])

    const toDisplayItem = (m) => {
        const ext = m.mediaType === 'video' ? 'MP4' : 'JPG'
        const gradient = m.mediaType === 'video' ? 'from-blue-500/20 to-cyan-500/20' : 'from-pink-500/20 to-purple-500/20'
        const sizeStr = m.size ? `${(m.size / (1024 * 1024)).toFixed(1)} MB` : ''
        const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
        return { ...m, type: ext, gradient, sizeStr, dateStr }
    }

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const result = await mediaService.uploadMedia(file)
            const url = result?.url ?? result?.data?.url ?? result
            if (url) {
                const newMedia = {
                    id: `upload-${Date.now()}`,
                    mediaType: file.type.startsWith('video/') ? 'video' : 'image',
                    mediaUrl: url,
                    thumbnailUrl: result?.thumbnailUrl ?? result?.data?.thumbnailUrl,
                    size: file.size,
                    createdAt: new Date().toISOString()
                }
                setMediaItems(prev => [toDisplayItem(newMedia), ...prev])
                toast.success("Media uploaded. Use it when creating a post.")
            }
        } catch (err) {
            console.error("Upload failed:", err)
            toast.error("Upload failed")
        } finally {
            setUploading(false)
            setUploadOpen(false)
        }
    }

    const handleView = (media) => {
        setSelectedMedia(media)
        setViewOpen(true)
    }

    const handleDelete = (id) => {
        setMediaItems(prev => prev.filter(item => item.id !== id))
        setViewOpen(false)
    }

    const API_BASE = import.meta.env.VITE_API_URL || ''
    const mediaUrl = (m) => {
        const url = m?.mediaUrl
        if (!url) return ''
        return url.startsWith('http') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`
    }

    return (
        <div>
            <PageHeader title="Media Studio" description={`${mediaItems.length} items · Media from your posts`} icon={Video} />
            <div className="sticky top-0 z-10 border-b border-border px-4 py-3 flex items-center justify-end bg-background/50">
                <Button size="sm" className="rounded-full font-bold" onClick={() => setUploadOpen(true)} disabled={uploading}>
                    {uploading ? "Uploading…" : <><Upload className="w-4 h-4 mr-2" /> Upload</>}
                </Button>
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="py-12 text-center text-muted-foreground">Loading media library…</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mediaItems.map((media) => {
                            const d = toDisplayItem(media)
                            return (
                                <div
                                    key={media.id}
                                    className="aspect-square bg-muted rounded-xl overflow-hidden relative group cursor-pointer border border-border/50"
                                    onClick={() => handleView(media)}
                                >
                                    {media.mediaUrl ? (
                                        media.mediaType === 'video' ? (
                                            <video src={mediaUrl(media)} className="w-full h-full object-cover" muted />
                                        ) : (
                                            <img src={mediaUrl(media)} alt="" className="w-full h-full object-cover" />
                                        )
                                    ) : (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${d.gradient}`} />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">View</span>
                                    </div>
                                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                        <span className="text-[10px] bg-black/60 px-1.5 rounded text-white backdrop-blur-md">{d.type}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                {!loading && mediaItems.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        No media yet. Upload when creating a post, or use the Upload button (file will be processed).
                    </div>
                )}
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
                                <DialogTitle>{selectedMedia.mediaUrl?.split('/').pop() || 'Media'}</DialogTitle>
                                <DialogDescription className="sr-only">Preview media details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                                    {selectedMedia.mediaType === 'video' ? (
                                        <video src={mediaUrl(selectedMedia)} controls className="max-w-full max-h-full" />
                                    ) : selectedMedia.mediaUrl ? (
                                        <img src={mediaUrl(selectedMedia)} alt="" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <span className="text-6xl opacity-20">{selectedMedia.type === 'MP4' ? '▶' : '🖼'}</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground mb-1">Type</div>
                                        <div className="font-medium">{selectedMedia.mediaType || selectedMedia.type || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Size</div>
                                        <div className="font-medium">{selectedMedia.sizeStr || (selectedMedia.size ? `${(selectedMedia.size / 1024).toFixed(1)} KB` : '—')}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-1">Uploaded</div>
                                        <div className="font-medium">{selectedMedia.dateStr || (selectedMedia.createdAt ? new Date(selectedMedia.createdAt).toLocaleDateString() : '—')}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => selectedMedia.mediaUrl && navigator.clipboard.writeText(mediaUrl(selectedMedia)).then(() => toast.success('Link copied'))}>
                                        Copy Link
                                    </Button>
                                    <Button variant="ghost" onClick={() => handleDelete(selectedMedia.id)}>Close</Button>
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
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [newPostText, setNewPostText] = useState("")
    const [newPostDate, setNewPostDate] = useState("")
    const [scheduling, setScheduling] = useState(false)

    useEffect(() => {
        const fetchScheduled = async () => {
            try {
                const data = await postService.getScheduledPosts()
                setPosts(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error("Failed to load scheduled posts:", err)
                toast.error("Failed to load scheduled posts")
            } finally {
                setLoading(false)
            }
        }
        fetchScheduled()
    }, [])

    const handleCreatePost = async (e) => {
        e.preventDefault()
        if (!newPostText.trim() || !newPostDate) return
        setScheduling(true)
        try {
            const scheduledAt = new Date(newPostDate).toISOString()
            await postService.schedulePost(newPostText.trim(), scheduledAt)
            const newPost = {
                id: `temp-${Date.now()}`,
                content: newPostText,
                scheduledAt,
                date: new Date(newPostDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
            }
            setPosts(prev => [newPost, ...prev])
            setNewPostText("")
            setNewPostDate("")
            setCreateOpen(false)
            toast.success("Post scheduled successfully")
            setTimeout(() => {
                postService.getScheduledPosts().then(data => setPosts(Array.isArray(data) ? data : []))
            }, 500)
        } catch (err) {
            console.error("Schedule failed:", err)
            toast.error("Failed to schedule post")
        } finally {
            setScheduling(false)
        }
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
                                    disabled={!newPostText.trim() || !newPostDate || scheduling}
                                >
                                    {scheduling ? "Scheduling…" : "Schedule"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="divide-y divide-border">
                {loading ? (
                    <div className="py-12 text-center text-muted-foreground">Loading scheduled posts…</div>
                ) : posts.length > 0 ? (
                    posts.map((post) => {
                        const dateStr = post.date || (post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '')
                        const text = post.content || post.text || ''
                        return (
                        <div key={post.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex-shrink-0 border border-white/5 flex items-center justify-center">
                                    <Feather className="w-5 h-5 text-blue-400 opacity-50" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Scheduled for {dateStr}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={async () => {
                                                    try {
                                                        await postService.deletePost(post.id)
                                                        setPosts(prev => prev.filter(p => p.id !== post.id))
                                                        toast.success("Scheduled post removed")
                                                    } catch (e) {
                                                        toast.error("Failed to remove")
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-[15px] leading-relaxed pr-8">{text}</p>
                                </div>
                            </div>
                        </div>
                    )
                    })
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
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        topInterests: [],
        gender: { male: 0, female: 0, other: 0 },
        topLocations: [],
        ageGroups: {},
        followerGrowth: { newFollowers: 0, unfollows: 0, netGrowth: 0 },
        activeTime: { bestHour: 20, bestDay: 'Friday' },
        engagementRate: 0,
        deviceUsage: { mobile: 0, desktop: 0, tablet: 0 },
        languages: [],
        totalFollowers: 0
    })
    const [apiError, setApiError] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const fetchInsights = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setApiError(false)
        try {
            const userId = user?.id
            const res = await analyticsService.getAudienceInsights(userId)
            if (res) setData((prev) => ({ ...prev, ...res }))
        } catch (err) {
            console.error('Audience insights error:', err)
            setApiError(true)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [user?.id])

    useEffect(() => {
        fetchInsights()
    }, [fetchInsights])

    const topInterests = data.topInterests || []
    const topLocations = data.topLocations || []
    const gender = data.gender || { male: 0, female: 0, other: 0 }
    const hasGenderData = (gender.male || gender.female || gender.other) > 0
    const ageGroups = data.ageGroups || {}
    const ageOrder = ['13-17', '18-24', '25-34', '35-44', '45+']

    return (
        <div>
            <PageHeader title="Audience Insights" description="Know your community" icon={Users} />

            {loading ? (
                <div className="p-8 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : !user ? (
                <div className="p-8 text-center text-muted-foreground">
                    <p>Please log in to view your audience insights.</p>
                </div>
            ) : apiError ? (
                <div className="p-8 text-center text-muted-foreground space-y-4">
                    <p>Unable to load audience insights. Please try again.</p>
                    <Button variant="outline" onClick={() => fetchInsights()}>
                        Retry
                    </Button>
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    <div className="flex justify-end -mt-2 mb-2">
                        <Button variant="outline" size="sm" onClick={() => fetchInsights(true)} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh data
                        </Button>
                    </div>
                    {/* Follower Growth */}
                    <div className="bg-black border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4">Follower Growth</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-2xl font-bold">{formatCount(data.totalFollowers ?? 0)}</p>
                                <p className="text-xs text-muted-foreground">Total Followers</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-500">+{data.followerGrowth?.newFollowers ?? 0}</p>
                                <p className="text-xs text-muted-foreground">New (Last 30 days)</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data.followerGrowth?.netGrowth >= 0 ? '+' : ''}{data.followerGrowth?.netGrowth ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Net Growth</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Interests */}
                    <div className="bg-black border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4">Top Interests</h3>
                        <p className="text-sm text-muted-foreground mb-4">Based on hashtags and engagement on your posts</p>
                        {topInterests.length > 0 ? (
                        <div className="space-y-4">
                            {topInterests.map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{item.label}</span>
                                        <span className="text-muted-foreground">{item.value}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, item.value)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Post with hashtags to see audience interests.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {hasGenderData ? (
                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">Gender</h3>
                            <div className="flex items-end gap-2 h-32 mt-4">
                                {(gender.male || 0) > 0 && (
                                    <div className="flex-1 bg-blue-500/20 rounded-t relative group min-h-[20%]" style={{ height: `${Math.max(gender.male || 0, 5)}%` }}>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold">{gender.male || 0}%</div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">Male</div>
                                    </div>
                                )}
                                {(gender.female || 0) > 0 && (
                                    <div className="flex-1 bg-pink-500/20 rounded-t relative group min-h-[20%]" style={{ height: `${Math.max(gender.female || 0, 5)}%` }}>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold">{gender.female || 0}%</div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">Female</div>
                                    </div>
                                )}
                                {(gender.other || 0) > 0 && (
                                    <div className="flex-1 bg-purple-500/20 rounded-t relative group min-h-[20%]" style={{ height: `${Math.max(gender.other, 5)}%` }}>
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold">{gender.other}%</div>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">Other</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        ) : (
                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">Gender</h3>
                            <p className="text-sm text-muted-foreground mt-4">Gender data is not collected. Add optional gender to user profiles to see this.</p>
                        </div>
                        )}

                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">Top Locations</h3>
                            {topLocations.length > 0 ? (
                            <div className="space-y-3 mt-4">
                                {topLocations.map((loc, i) => (
                                    <div key={i} className="flex justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                                        <span>{loc.country}</span>
                                        <span className="font-bold text-muted-foreground">{typeof loc.pct === 'number' ? `${loc.pct}%` : loc.pct}</span>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                <p className="text-sm text-muted-foreground mt-4">Follower locations will appear when your followers add their location.</p>
                            )}
                        </div>
                    </div>

                    {/* Age Distribution */}
                    <div className="bg-black border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4">Age Groups</h3>
                        {Object.keys(ageGroups).length > 0 ? (
                            <div className="flex items-end gap-3 h-32 mt-4">
                                {ageOrder.filter((k) => ageGroups[k]).map((key) => {
                                    const total = Object.values(ageGroups).reduce((a, b) => a + b, 0)
                                    const pct = total > 0 ? Math.round((ageGroups[key] / total) * 100) : 0
                                    return (
                                        <div key={key} className="flex-1 flex flex-col items-center">
                                            <div className="w-full bg-primary/30 rounded-t flex-1 flex items-end justify-center min-h-[24px]" style={{ height: `${Math.max(pct, 8)}%` }}>
                                                <span className="text-xs font-bold mb-1">{pct}%</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-2">{key}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Age distribution from your followers&apos; birthdates will appear here when available.</p>
                        )}
                    </div>

                    {/* Best Time to Post & Engagement */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">Best Time to Post</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                Most active: <span className="font-bold text-foreground">{String(data.activeTime?.bestHour ?? 20).padStart(2,'0')}:00 – {String(Math.min(23, (data.activeTime?.bestHour ?? 20) + 3)).padStart(2,'0')}:00</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Best day: <span className="font-bold text-foreground">{data.activeTime?.bestDay ?? 'Friday'}</span>
                            </p>
                        </div>
                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">Engagement Rate</h3>
                            <p className="text-2xl font-bold text-primary mt-2">{data.engagementRate ?? 0}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Average engagement on your posts</p>
                        </div>
                    </div>

                    {/* Device Usage - only show when we have real data */}
                    {(data.deviceUsage?.mobile || data.deviceUsage?.desktop || data.deviceUsage?.tablet) > 0 ? (
                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-4">Device Usage</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Mobile', value: data.deviceUsage?.mobile ?? 0, color: 'bg-blue-500' },
                                    { label: 'Desktop', value: data.deviceUsage?.desktop ?? 0, color: 'bg-green-500' },
                                    { label: 'Tablet', value: data.deviceUsage?.tablet ?? 0, color: 'bg-purple-500' }
                                ].filter((d) => d.value > 0).map((d) => (
                                    <div key={d.label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{d.label}</span>
                                            <span className="text-muted-foreground">{d.value}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-black border border-border rounded-xl p-6">
                            <h3 className="font-bold mb-2">Device Usage</h3>
                            <p className="text-sm text-muted-foreground">Device usage data is not tracked.</p>
                        </div>
                    )}

                    {/* Languages */}
                    <div className="bg-black border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4">Languages</h3>
                        {data.languages?.length > 0 ? (
                            <div className="space-y-2">
                                {data.languages.map((l, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span>{l.lang}</span>
                                        <span className="text-muted-foreground">{l.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Language preferences from your followers will appear here.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export function PostDetail() {
    const { id } = useParams()
    const [post, setPost] = useState(null)
    const [replies, setReplies] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { deletePost } = usePosts({ tab: 'for-you' })

    const updatePost = (updater) => setPost((prev) => (prev ? updater(prev) : prev))
    const updateReplies = (updater) => setReplies((prev) => updater(prev))

    const updateItem = (postId, updater) => {
        if (post?.id === postId) updatePost(updater)
        else updateReplies((list) => list.map((p) => (p.id === postId ? updater(p) : p)))
    }

    const likePost = async (postId) => {
        updateItem(postId, (p) => ({ ...p, _count: { ...p._count, likes: (p._count?.likes || 0) + 1 }, likes: [{ id: 'temp' }] }))
        try {
            await postService.likePost(postId)
        } catch (err) {
            console.error('Error liking post:', err)
            updateItem(postId, (p) => ({ ...p, _count: { ...p._count, likes: Math.max((p._count?.likes || 0) - 1, 0) }, likes: [] }))
        }
    }
    const unlikePost = async (postId) => {
        updateItem(postId, (p) => ({ ...p, _count: { ...p._count, likes: Math.max((p._count?.likes || 0) - 1, 0) }, likes: [] }))
        try {
            await postService.unlikePost(postId)
        } catch (err) {
            console.error('Error unliking post:', err)
            updateItem(postId, (p) => ({ ...p, _count: { ...p._count, likes: (p._count?.likes || 0) + 1 }, likes: [{ id: 'temp' }] }))
        }
    }
    const retweetPost = async (postId) => {
        updateItem(postId, (p) => ({ ...p, _count: { ...p._count, retweets: (p._count?.retweets || 0) + 1 }, retweets: [{ id: 'temp' }] }))
        try {
            await postService.retweetPost(postId)
        } catch (err) {
            console.error('Error retweeting post:', err)
            updateItem(postId, (p) => ({ ...p, _count: { ...p._count, retweets: Math.max((p._count?.retweets || 0) - 1, 0) }, retweets: [] }))
        }
    }
    const unretweetPost = async (postId) => {
        updateItem(postId, (p) => ({ ...p, _count: { ...p._count, retweets: Math.max((p._count?.retweets || 0) - 1, 0) }, retweets: [] }))
        try {
            await postService.unretweetPost(postId)
        } catch (err) {
            console.error('Error unretweeting post:', err)
            updateItem(postId, (p) => ({ ...p, _count: { ...p._count, retweets: (p._count?.retweets || 0) + 1 }, retweets: [{ id: 'temp' }] }))
        }
    }
    const bookmarkPost = async (postId) => {
        updateItem(postId, (p) => ({ ...p, bookmarks: [{ id: 'temp' }] }))
        try {
            await postService.bookmarkPost(postId)
        } catch (err) {
            console.error('Error bookmarking post:', err)
            updateItem(postId, (p) => ({ ...p, bookmarks: [] }))
        }
    }
    const unbookmarkPost = async (postId) => {
        updateItem(postId, (p) => ({ ...p, bookmarks: [] }))
        try {
            await postService.unbookmarkPost(postId)
        } catch (err) {
            console.error('Error unbookmarking post:', err)
            updateItem(postId, (p) => ({ ...p, bookmarks: [{ id: 'temp' }] }))
        }
    }

    const fetchData = async (isRefetch = false) => {
        if (!id) return
        try {
            if (!isRefetch) setLoading(true)
            const [postData, repliesData] = await Promise.all([
                postService.getPost(id),
                postService.getReplies(id)
            ])
            setPost(postData)
            setReplies(Array.isArray(repliesData) ? repliesData : repliesData?.posts || [])
        } catch (err) {
            console.error('PostDetail fetch error:', err)
            setError(err.response?.data?.message || err.message || 'Failed to load post')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!id) return
        fetchData()
    }, [id])

    // Refetch when feed-refresh (e.g. user posted reply) or post_published (new post/reply from anyone)
    useEffect(() => {
        const onRefresh = () => fetchData(true)
        window.addEventListener('feed-refresh', onRefresh)
        const socket = io(`${API_URL}/feed`, { path: '/ws/live', transports: ['polling', 'websocket'] })
        socket.on('post_published', onRefresh)
        return () => {
            window.removeEventListener('feed-refresh', onRefresh)
            socket.disconnect()
        }
    }, [id])

    if (loading) {
        return (
            <div>
                <PageHeader title="Post" />
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
            </div>
        )
    }
    if (error || !post) {
        return (
            <div>
                <PageHeader title="Post" />
                <div className="p-8 text-center text-muted-foreground">{error || 'Post not found'}</div>
            </div>
        )
    }

    return (
        <div>
            <PageHeader title="Post" />
            <PostCard
                post={post}
                onLike={likePost}
                onUnlike={unlikePost}
                onRetweet={retweetPost}
                onUnretweet={unretweetPost}
                onBookmark={bookmarkPost}
                onUnbookmark={unbookmarkPost}
                onDelete={deletePost}
            />
            {replies.length > 0 && (
                <div className="border-t border-border">
                    <div className="px-4 py-3 border-b border-border">
                        <h3 className="font-bold text-[15px]">Replies</h3>
                    </div>
                    {replies.map((reply) => (
                        <PostCard
                            key={reply.id}
                            post={reply}
                            onLike={likePost}
                            onUnlike={unlikePost}
                            onRetweet={retweetPost}
                            onUnretweet={unretweetPost}
                            onBookmark={bookmarkPost}
                            onUnbookmark={unbookmarkPost}
                            onDelete={deletePost}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
