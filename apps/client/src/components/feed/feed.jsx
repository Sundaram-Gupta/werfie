import { PostCard } from "./post-card"
import { AnnouncementFeedCard } from "./announcement-feed-card"
import { usePosts } from "@/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "react-i18next"

export function Feed({ tab = 'for-you' }) {
    const { t } = useTranslation()
    const { posts, loading, error, likePost, unlikePost, retweetPost, unretweetPost, deletePost } = usePosts({ tab })

    if (loading) {
        return (
            <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-32 w-full rounded-2xl mt-2" />
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
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>{t('feed.no_posts_yet') || 'No posts yet.'}</p>
                <p className="text-sm">{t('feed.be_first_to_post') || 'Be the first to post something!'}</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border">
            {posts.map((item) => {
                if (item.isOfficialAnnouncement) {
                    return <AnnouncementFeedCard key={`ann-${item.id}`} announcement={item} />
                }
                return (
                    <PostCard
                        key={item.id}
                        post={item}
                        onLike={likePost}
                        onUnlike={unlikePost}
                        onRetweet={retweetPost}
                        onUnretweet={unretweetPost}
                        onDelete={deletePost}
                    />
                )
            })}
        </div>
    )
}
