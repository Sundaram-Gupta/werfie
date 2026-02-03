import { PostCard } from "./post-card"
import { usePosts } from "@/hooks/usePosts"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslation } from "react-i18next" // Added useTranslation import

export function Feed({ tab = 'for-you' }) {
    const { t } = useTranslation() // Added useTranslation hook
    const { posts, loading, likePost, unlikePost, retweetPost, unretweetPost } = usePosts({ tab })


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

    if (!posts || !Array.isArray(posts)) {
        return <div className="p-8 text-center text-muted-foreground">{t('feed.unable_to_load_posts')}</div> // Used t()
    }

    if (posts.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>{t('feed.no_posts_yet')}</p>
                <p className="text-sm">{t('feed.be_first_to_post')}</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-border">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    onLike={likePost}
                    onUnlike={unlikePost}
                    onRetweet={retweetPost}
                    onUnretweet={unretweetPost}
                />
            ))}
        </div>
    )
}
