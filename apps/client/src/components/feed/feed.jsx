import { useRef, useEffect } from "react"
import { PostCard } from "./post-card"
import { AnnouncementFeedCard } from "./announcement-feed-card"
import { usePosts } from "@/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

export function Feed({ tab = 'for-you', ...rest }) {
    const { t } = useTranslation()
    const { posts, loading, error, loadMore, hasMore, loadingMore, likePost, unlikePost, retweetPost, unretweetPost, bookmarkPost, unbookmarkPost, deletePost } = usePosts({ tab, ...rest })
    const loadMoreTriggerRef = useRef(null)
    const feedRef = useRef(null)

    // Infinite scroll: when user scrolls near bottom, load more posts (Intersection Observer)
    useEffect(() => {
        if (!hasMore || loadingMore) return
        const el = loadMoreTriggerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore()
            },
            { rootMargin: '200px', threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [hasMore, loadingMore, loadMore])

    if (loading && posts.length === 0) {
        return (
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex gap-4 p-4 animate-pulse">
                        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-3 pt-1">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-[90%]" />
                            <Skeleton className="h-[200px] w-full rounded-2xl mt-3" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-500/5 m-4 rounded-xl border border-red-500/20">
                <p className="font-bold">{t('common.error') || 'Error'}</p>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    if (!posts || !Array.isArray(posts)) {
        return <div className="p-8 text-center text-muted-foreground">{t('feed.unable_to_load_posts')}</div>
    }

    if (posts.length === 0) {
        if (tab === 'bookmarks') {
            return (
                <div className="p-8 text-center text-muted-foreground">
                    <p className="font-medium">{t('bookmarks.empty_title')}</p>
                    <p className="text-sm mt-1">{t('bookmarks.empty_subtitle')}</p>
                </div>
            )
        }
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>{t('feed.no_posts_yet') || 'No posts yet.'}</p>
                <p className="text-sm">{t('feed.be_first_to_post') || 'Be the first to post something!'}</p>
            </div>
        )
    }

    return (
        <div ref={feedRef} className="relative">
            {/* Subtle Refreshing Indicator (if posts already exist) */}
            {loading && posts.length > 0 && (
                <div className="h-1 bg-primary/20 overflow-hidden sticky top-[53px] z-10 w-full">
                    <div className="h-full bg-primary animate-progress-indeterminate origin-left" />
                </div>
            )}

            <div className="divide-y divide-border">
            {posts.map((item, index) => {
                if (item.isOfficialAnnouncement) {
                    return <AnnouncementFeedCard key={`ann-${item.id}`} announcement={item} />
                }
                return (
                    <PostCard
                        key={item.id}
                        post={item}
                        priorityMedia={index < 2}
                        onLike={likePost}
                        onUnlike={unlikePost}
                        onRetweet={retweetPost}
                        onUnretweet={unretweetPost}
                        onBookmark={bookmarkPost}
                        onUnbookmark={unbookmarkPost}
                        onDelete={deletePost}
                    />
                )
            })}
            {/* Sentinel for infinite scroll: when this enters viewport, loadMore() runs */}
            {hasMore && (
                <div ref={loadMoreTriggerRef} className="flex justify-center py-4 border-t border-border" aria-hidden>
                    {loadingMore && (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    )}
                </div>
            )}
            </div>
        </div>
    )
}
