import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link as RouterLink } from "react-router-dom"
import { BadgeCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { PostActions } from "./post-actions"
import { MoreOptionsDropdown } from "./more-options-dropdown"
import { ArticlePreviewCard } from "./article-preview-card"

import { getMediaUrl } from "@/lib/utils"
import { getApiBase } from "@/lib/api"
import { PollDisplay } from "./poll-display"
import { parsePollContent } from "@/lib/poll-utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useEffect, useMemo, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

// ---- Shared auto-play manager (single observer, single active video) ----
const videoAutoPlayManager = (() => {
    const videos = new Set()
    /** @type {IntersectionObserver | null} */
    let observer = null
    /** @type {HTMLVideoElement | null} */
    let active = null
    const ratios = new Map() // video -> intersectionRatio

    const THRESHOLD_PLAY = 0.7

    const ensureObserver = () => {
        if (observer) return observer
        if (typeof window === 'undefined') return null
        if (typeof window.IntersectionObserver === 'undefined') return null

        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const el = entry.target
                    ratios.set(el, entry.isIntersecting ? (entry.intersectionRatio || 0) : 0)

                    // Start buffering slightly before it becomes eligible to play
                    if (entry.isIntersecting && (entry.intersectionRatio || 0) >= 0.15) {
                        try {
                            el.preload = 'auto'
                            if (el.readyState === 0) el.load()
                        } catch {
                            // ignore
                        }
                    }
                }

                // Pick the best candidate (highest ratio >= threshold)
                let candidate = null
                let best = THRESHOLD_PLAY
                for (const v of videos) {
                    const r = ratios.get(v) || 0
                    if (r >= best) {
                        best = r
                        candidate = v
                    }
                }

                // Pause active if it is no longer eligible
                if (active && active !== candidate) {
                    try {
                        active.__autoPause = true
                        active.pause()
                    } catch {
                        // ignore
                    } finally {
                        active.__autoPause = false
                    }
                    active = null
                }

                if (!candidate) return

                // Respect manual pause: if user paused it, don't auto-play again while still in view.
                if (candidate.dataset?.userPaused === '1') return

                // Pause any other playing videos (safety)
                for (const v of videos) {
                    if (v !== candidate) {
                        try {
                            v.__autoPause = true
                            v.pause()
                        } catch {
                            // ignore
                        } finally {
                            v.__autoPause = false
                        }
                    }
                }

                active = candidate
                try {
                    candidate.muted = true
                    candidate.playsInline = true
                    candidate.autoplay = true
                    void candidate.play()
                } catch {
                    // autoplay may be blocked; ignore
                }
            },
            { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1] }
        )

        return observer
    }

    const register = (videoEl) => {
        if (!videoEl) return () => {}
        videos.add(videoEl)
        ratios.set(videoEl, 0)

        const obs = ensureObserver()
        if (obs) obs.observe(videoEl)

        // Track manual user intent
        const onPause = () => {
            // If we paused it programmatically, don't treat it as user action.
            if (videoEl.__autoPause) return
            // User paused: prevent immediate auto-resume until it leaves view and re-enters.
            videoEl.dataset.userPaused = '1'
        }
        const onPlay = () => {
            // If user plays manually, clear the manual-pause lock.
            videoEl.dataset.userPaused = '0'
        }
        const onEnded = () => {
            // Allow autoplay next time it becomes visible.
            videoEl.dataset.userPaused = '0'
        }

        videoEl.addEventListener('pause', onPause)
        videoEl.addEventListener('play', onPlay)
        videoEl.addEventListener('ended', onEnded)

        return () => {
            videos.delete(videoEl)
            ratios.delete(videoEl)
            try {
                if (observer) observer.unobserve(videoEl)
            } catch {
                // ignore
            }
            videoEl.removeEventListener('pause', onPause)
            videoEl.removeEventListener('play', onPlay)
            videoEl.removeEventListener('ended', onEnded)

            if (active === videoEl) {
                active = null
            }

            // Tear down observer when no videos remain
            if (videos.size === 0 && observer) {
                try {
                    observer.disconnect()
                } catch {
                    // ignore
                }
                observer = null
            }
        }
    }

    return { register }
})()

function AutoPlayVideo({ src, poster, className, style, onError }) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        // Default required for autoplay policies; user can unmute via controls.
        el.muted = true
        el.playsInline = true
        if (el.dataset.userPaused == null) el.dataset.userPaused = '0'

        const unregister = videoAutoPlayManager.register(el)
        return () => {
            unregister?.()
        }
    }, [])

    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            muted
            playsInline
            controls
            preload="metadata"
            className={className}
            style={style}
            onError={onError}
        />
    )
}

export function PostCard({ post, onLike, onUnlike, onRetweet, onUnretweet, onBookmark, onUnbookmark, onDelete, onToggleHighlight }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const mediaBase = getApiBase() || ''

    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState(null)
    const [contentExpanded, setContentExpanded] = useState(false)

    const imageMediaUrls = useMemo(() => {
        const list = Array.isArray(post?.media) ? post.media : []
        return list
            .map((media) => {
                const raw = media?.mediaUrl
                if (!raw) return null
                const mediaUrl = raw.startsWith('http') ? raw : `${mediaBase}${raw}`
                const urlLower = mediaUrl.toLowerCase()
                const looksLikeVideo =
                    urlLower.endsWith('.mp4') || urlLower.endsWith('.webm') || urlLower.endsWith('.mov') || urlLower.endsWith('.m4v') ||
                    urlLower.includes('.mp4?') || urlLower.includes('.webm?') || urlLower.includes('.mov?') || urlLower.includes('.m4v?')
                const isImage = media?.mediaType === 'image' && !looksLikeVideo
                return isImage ? mediaUrl : null
            })
            .filter(Boolean)
    }, [post?.media, mediaBase])

    useEffect(() => {
        if (!lightboxOpen) return
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [lightboxOpen])
    
    const handleUserClick = (e) => {
        e.stopPropagation()
        const userId = post.user?.id || post.userId
        if (userId) {
            navigate(`/profile/${userId}`)
        }
    }

    // Handle backend data structure
    // Backend returns: { id, userId, content, createdAt, user: { id, email, profile: { name, handle } } }
    // Fallback: use email prefix when profile is null (registration may not create Profile)

    const emailPrefix = (post.user?.email || '').split('@')[0] || ''
    const handle = post.user?.profile?.handle || post.user?.handle || emailPrefix || 'user'
    const user = {
        id: post.user?.id || post.userId,
        userId: post.user?.id || post.userId,
        name: post.user?.profile?.name || post.user?.name || (handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'User'),
        handle,
        avatar: post.user?.profile?.avatar || post.user?.avatar || null,
        verified: post.user?.profile?.verified || post.user?.verified || false
    }

    // Format timestamp
    const getRelativeTime = (dateString) => {
        if (!dateString) return 'now'
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now - date) / 1000)

        if (seconds < 60) return `${seconds}${t('time.s')}`
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes}${t('time.m')}`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}${t('time.h')}`
        const days = Math.floor(hours / 24)
        return `${days}${t('time.d')}`
    }

    const timestamp = getRelativeTime(post.createdAt || post.timestamp)

    // Format stats
    const stats = {
        comments: post._count?.replies || post.stats?.comments || 0,
        reposts: post._count?.retweets || post.stats?.reposts || 0,
        likes: post._count?.likes || post.stats?.likes || 0,
        views: post.stats?.views || '0'
    }

    // Detect article links for preview cards
    const articleId = useMemo(() => {
        const content = post.content ?? post.text ?? post.body ?? post.data?.content ?? '';
        if (typeof content !== 'string') return null;
        
        // Match /article/UUID or /article/ID
        const match = content.match(/\/article\/([a-zA-Z0-9-]+)/);
        return match ? match[1] : null;
    }, [post.content]);

    const renderContentWithLinks = (text) => {
        if (!text) return null;
        
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        
        return parts.map((part, i) => {
            if (part.match(urlRegex)) {
                const isInternal = part.includes(window.location.host) || part.startsWith('/');
                const isArticle = part.includes('/article/');
                
                if (isInternal && isArticle) {
                    const path = part.includes(window.location.host) 
                        ? part.split(window.location.host)[1] 
                        : part;
                    return (
                        <RouterLink 
                            key={i} 
                            to={path} 
                            className="text-blue-500 hover:underline break-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </RouterLink>
                    );
                }
                
                return (
                    <a 
                        key={i} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };



    return (
        <div className="flex gap-3 px-4 py-3 border-b border-border hover:bg-white/[0.03] transition-colors cursor-pointer">
            {/* User avatar column */}
            <div className="flex-shrink-0" onClick={handleUserClick}>
                <Avatar className="w-10 h-10 hover:opacity-90 transition-opacity">
                    <AvatarImage src={getMediaUrl(user.avatar)} />
                    <AvatarFallback>{user.name[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
            </div>

            {/* Main content column */}
            <div className="flex-1 min-w-0">
                {/* Header: user info and more options */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-hidden text-[15px]" onClick={handleUserClick}>
                        <span className="font-bold truncate text-foreground hover:underline">{user.name}</span>
                        {user.verified && <BadgeCheck className="w-[18px] h-[18px] text-blue-500 fill-blue-500/10" />}
                        <span className="text-muted-foreground truncate hover:underline">@{user.handle}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground whitespace-nowrap">{timestamp}</span>
                    </div>
                    <MoreOptionsDropdown user={user} contentId={post.id} post={post} onDelete={onDelete} onToggleHighlight={onToggleHighlight} />
                </div>

                {/* Reply indicator */}
                {post.replyToId && (
                    <p className="text-[13px] text-muted-foreground mt-0.5 mb-0.5">
                        {t('feed.replying_to') || 'Replying to'}{' '}
                        <span className="text-primary">
                            @{post.replyToHandle || post.replyTo?.user?.profile?.handle || post.replyTo?.user?.handle || 'unknown'}
                        </span>
                    </p>
                )}

                {/* Post content: poll or plain text */}
                {(() => {
                    const raw = post.content ?? post.text ?? post.body ?? post.data?.content ?? ''
                    const text = typeof raw === 'object' ? JSON.stringify(raw) : String(raw ?? '')
                    const parsed = parsePollContent(text)
                    if (parsed) {
                        return <PollDisplay content={text} createdAt={post.createdAt || post.timestamp} />
                    }

                    const MAX_PREVIEW_CHARS = 320
                    const trimmed = text.trim()
                    const isLong = trimmed.length > MAX_PREVIEW_CHARS
                    const preview = isLong ? `${trimmed.slice(0, MAX_PREVIEW_CHARS)}…` : trimmed

                    const showMoreText = (() => {
                        const v = t('feed.show_more')
                        return v && v !== 'feed.show_more' ? v : 'Show more'
                    })()
                    const showLessText = (() => {
                        const v = t('feed.show_less')
                        return v && v !== 'feed.show_less' ? v : 'Show less'
                    })()

                    return (
                        <div className="mt-0.5">
                            <div className="text-[15px] leading-5 whitespace-pre-wrap break-words text-foreground">
                                {renderContentWithLinks(contentExpanded || !isLong ? trimmed : preview)}
                            </div>
                            {isLong && (
                                <button
                                    type="button"
                                    className="mt-1 text-[14px] font-semibold text-blue-500 hover:underline"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setContentExpanded(v => !v)
                                    }}
                                >
                                    {contentExpanded ? showLessText : showMoreText}
                                </button>
                            )}
                        </div>
                    )
                })()}

                {/* Media Attachments */}
                {post.media && post.media.length > 0 && (
                    <div className={`mt-3 rounded-2xl overflow-hidden border border-border ${
                        post.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
                    }`}>
                        {post.media.map((media, index) => {
                            // Handle both R2 URLs (absolute) and local URLs (relative)
                            const mediaUrl = media.mediaUrl?.startsWith('http') 
                                ? media.mediaUrl 
                                : `${mediaBase}${media.mediaUrl}`;
                            const thumbnailUrl = media.thumbnailUrl?.startsWith('http')
                                ? media.thumbnailUrl
                                : media.thumbnailUrl ? `${mediaBase}${media.thumbnailUrl}` : null;
                            const urlLower = (mediaUrl || '').toString().toLowerCase()
                            const looksLikeVideo = urlLower.endsWith('.mp4') || urlLower.endsWith('.webm') || urlLower.endsWith('.mov') || urlLower.endsWith('.m4v') || urlLower.includes('.mp4?') || urlLower.includes('.webm?') || urlLower.includes('.mov?') || urlLower.includes('.m4v?')
                            const isImage = media.mediaType === 'image' && !looksLikeVideo

                            return (
                                <div key={media.id || index} className="relative bg-black">
                                    {isImage ? (
                                        <img
                                            src={mediaUrl}
                                            alt="Post media"
                                            className="w-full h-auto object-cover cursor-zoom-in"
                                            style={{ maxHeight: post.media.length === 1 ? '500px' : '250px' }}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setLightboxSrc(mediaUrl)
                                                setLightboxOpen(true)
                                            }}
                                            onError={(e) => {
                                                console.error('Image load failed:', mediaUrl);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <AutoPlayVideo
                                            src={mediaUrl}
                                            poster={thumbnailUrl}
                                            className="w-full h-auto"
                                            style={{ maxHeight: post.media.length === 1 ? '500px' : '250px' }}
                                            onError={() => {
                                                console.error('Video load failed:', mediaUrl);
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Article Preview Card */}
                {articleId && (
                    <ArticlePreviewCard articleId={articleId} />
                )}

                {/* Fullscreen image viewer */}
                <Dialog open={lightboxOpen} onOpenChange={(v) => setLightboxOpen(!!v)}>
                    <DialogContent className="max-w-none w-screen h-screen p-0 bg-black border-0 rounded-none [&>button]:hidden">
                        <div
                            className="w-full h-full flex items-center justify-center relative"
                            onClick={() => setLightboxOpen(false)}
                        >
                            {/* Close button */}
                            <button
                                type="button"
                                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setLightboxOpen(false)
                                }}
                                aria-label="Close"
                                title="Close"
                            >
                                ×
                            </button>

                            {/* Image */}
                            {lightboxSrc ? (
                                <img
                                    src={lightboxSrc}
                                    alt="Full screen media"
                                    className="max-w-[100vw] max-h-[100vh] object-contain select-none"
                                    onClick={(e) => {
                                        // prevent closing when clicking the image
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                />
                            ) : null}

                            {/* Hint */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                                Click outside or press ESC to close
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>



                {/* Post interaction buttons */}
                <PostActions
                    stats={stats}
                    post={post}
                    onLike={onLike}
                    onUnlike={onUnlike}
                    onRetweet={onRetweet}
                    onUnretweet={onUnretweet}
                    onBookmark={onBookmark}
                    onUnbookmark={onUnbookmark}
                />
            </div>
        </div>
    )
}
