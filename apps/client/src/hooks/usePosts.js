import { postService, userService, authService, announcementService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect, useRef } from 'react'

export function usePosts(params = {}) {
    const { user: currentUser } = useAuth()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchPosts = async () => {
        try {
            setLoading(true)
            let data;
            let announcementsData = [];

            if (params.tab === 'following') {
                data = await postService.getFollowingPosts()
            } else if (params.tab === 'for-you') {
                // Fetch posts and announcements concurrently as requested
                const [postsRes, annRes] = await Promise.all([
                    authService.getFeed(),
                    announcementService.getFeed().catch(e => {
                        console.error('Failed to fetch announcements feed:', e);
                        return [];
                    })
                ]);
                data = postsRes;
                announcementsData = Array.isArray(annRes) ? annRes : (annRes.posts || []);
            } else {
                data = await postService.getPosts(params)
            }
            let fetchedPosts = [];
            if (Array.isArray(data)) {
                fetchedPosts = data;
            } else if (data && Array.isArray(data.posts)) {
                fetchedPosts = data.posts;
            }

            // Merge with announcements and annotate
            const annotatedAnnouncements = announcementsData.map(ann => ({
                ...ann,
                isOfficialAnnouncement: true
            }));

            fetchedPosts = [...fetchedPosts, ...annotatedAnnouncements].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Extract unique user IDs (excluding announcements)
            const userIds = [...new Set(
                fetchedPosts
                    .filter(item => !item.isOfficialAnnouncement && item.userId)
                    .map(item => item.userId)
            )];

            // Bulk fetch users
            if (userIds.length > 0) {
                const users = await userService.getUsers(userIds);
                const userMap = {};
                users.forEach(user => {
                    userMap[user.id] = user;
                });

                // Hydrate posts (only if not an announcement)
                fetchedPosts = fetchedPosts.map(item => {
                    if (item.isOfficialAnnouncement) return item;
                    return {
                        ...item,
                        user: userMap[item.userId] || {
                            id: item.userId,
                            name: 'Unknown',
                            handle: 'unknown',
                            profile: { name: 'Unknown', handle: 'unknown', avatar: null }
                        }
                    };
                });
            }

            console.log(`[FE_DEBUG_FEED] Items: ${fetchedPosts.length}, Announcements: ${fetchedPosts.filter(i => i.isOfficialAnnouncement).length}`);
            setPosts(fetchedPosts)
            setError(null)
        } catch (err) {
            console.error('Error fetching posts:', err)
            setError(err.response?.data?.details || err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [JSON.stringify(params)])

    const fetchRef = useRef(fetchPosts)
    fetchRef.current = fetchPosts
    useEffect(() => {
        const onRefresh = () => fetchRef.current()
        window.addEventListener('feed-refresh', onRefresh)
        return () => window.removeEventListener('feed-refresh', onRefresh)
    }, [])

    const createPost = async (content, mediaUrls = [], replyToId = null) => {
        try {
            const newPost = await postService.createPost(content, mediaUrls, replyToId)
            // Optimistically add current user details
            const postWithUser = {
                ...newPost,
                user: currentUser || { id: newPost.userId, name: 'Me', handle: 'me' }
            }
            setPosts([postWithUser, ...posts])
            return newPost
        } catch (err) {
            console.error('Error creating post:', err)
            throw err
        }
    }


    const likePost = async (postId) => {
        // Optimistic update
        const previousPosts = [...posts]
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, _count: { ...post._count, likes: (post._count?.likes || 0) + 1 }, likes: [{ id: 'temp' }] }
                : post
        ))

        try {
            await postService.likePost(postId)
        } catch (err) {
            console.error('Error liking post:', err)
            // Rollback on error
            setPosts(previousPosts)
        }
    }

    const unlikePost = async (postId) => {
        // Optimistic update
        const previousPosts = [...posts]
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, _count: { ...post._count, likes: Math.max((post._count?.likes || 0) - 1, 0) }, likes: [] }
                : post
        ))

        try {
            await postService.unlikePost(postId)
        } catch (err) {
            console.error('Error unliking post:', err)
            // Rollback on error
            setPosts(previousPosts)
        }
    }

    const retweetPost = async (postId) => {
        // Optimistic update
        const previousPosts = [...posts]
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, _count: { ...post._count, retweets: (post._count?.retweets || 0) + 1 }, retweets: [{ id: 'temp' }] }
                : post
        ))

        try {
            await postService.retweetPost(postId)
        } catch (err) {
            console.error('Error retweeting post:', err)
            // Rollback on error
            setPosts(previousPosts)
        }
    }

    const unretweetPost = async (postId) => {
        // Optimistic update
        const previousPosts = [...posts]
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, _count: { ...post._count, retweets: Math.max((post._count?.retweets || 0) - 1, 0) }, retweets: [] }
                : post
        ))

        try {
            await postService.unretweetPost(postId)
        } catch (err) {
            console.error('Error unretweeting post:', err)
            // Rollback on error
            setPosts(previousPosts)
        }
    }

    const deletePost = async (postId) => {
        try {
            await postService.deletePost(postId)
            setPosts(posts.filter(post => post.id !== postId))
        } catch (err) {
            console.error('Error deleting post:', err)
            throw err
        }
    }

    return {
        posts,
        loading,
        error,
        createPost,
        likePost,
        unlikePost,
        retweetPost,
        unretweetPost,
        deletePost,
        refetch: fetchPosts,
    }
}
