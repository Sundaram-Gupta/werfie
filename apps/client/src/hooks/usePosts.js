import { io } from 'socket.io-client'
import { postService, userService, authService, announcementService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

            if (params.tab === 'bookmarks') {
                const res = await postService.getBookmarks({ limit: 50 })
                data = Array.isArray(res) ? res : (res?.posts || [])
            } else if (params.tab === 'following') {
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

            // For bookmarks tab, each post is already bookmarked (mark for UI)
            if (params.tab === 'bookmarks') {
                fetchedPosts = fetchedPosts.map(p => ({ ...p, bookmarks: p.bookmarks?.length ? p.bookmarks : [{ id: 'bookmarked' }] }))
            }

            // Merge with announcements (skip for bookmarks tab)
            const annotatedAnnouncements = announcementsData.map(ann => ({
                ...ann,
                isOfficialAnnouncement: true
            }));
            if (params.tab !== 'bookmarks') {
                fetchedPosts = [...fetchedPosts, ...annotatedAnnouncements].sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
            } else {
                fetchedPosts = [...fetchedPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            // Extract unique user IDs (excluding announcements; bookmarks tab may already have user)
            const userIds = [...new Set(
                fetchedPosts
                    .filter(item => !item.isOfficialAnnouncement && item.userId)
                    .map(item => item.userId)
            )];

            // Bulk fetch users (non-fatal: show posts with Unknown if fetch fails)
            let userMap = {};
            if (userIds.length > 0) {
                try {
                    const users = await userService.getUsers(userIds);
                    (Array.isArray(users) ? users : []).forEach(user => {
                        userMap[user.id] = user;
                    });
                } catch (err) {
                    console.warn('Failed to fetch user profiles for posts, using fallbacks:', err?.response?.data?.details || err?.message);
                }
            }

            // Hydrate posts (only if not an announcement); preserve bookmarks so filled icon shows on load/refresh
            fetchedPosts = fetchedPosts.map(item => {
                if (item.isOfficialAnnouncement) return item;
                const bookmarks = Array.isArray(item.bookmarks) ? item.bookmarks : [];
                return {
                    ...item,
                    bookmarks,
                    user: userMap[item.userId] || {
                        id: item.userId,
                        name: 'Unknown',
                        handle: 'unknown',
                        profile: { name: 'Unknown', handle: 'unknown', avatar: null }
                    }
                };
            });

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

    // WebSocket via gateway – scheduled posts appear when published (no polling, no page refresh)
    useEffect(() => {
        const socket = io(`${API_URL}/feed`, { path: '/ws/live', transports: ['polling', 'websocket'] })
        socket.on('post_published', () => fetchRef.current())
        return () => socket.disconnect()
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

    const bookmarkPost = async (postId) => {
        const previousPosts = [...posts]
        setPosts(posts.map(post =>
            post.id === postId
                ? { ...post, bookmarks: [{ id: 'temp' }] }
                : post
        ))
        try {
            await postService.bookmarkPost(postId)
        } catch (err) {
            console.error('Error bookmarking post:', err)
            setPosts(previousPosts)
        }
    }

    const unbookmarkPost = async (postId) => {
        const previousPosts = [...posts]
        if (params.tab === 'bookmarks') {
            setPosts(posts.filter(p => p.id !== postId))
        } else {
            setPosts(posts.map(post =>
                post.id === postId ? { ...post, bookmarks: [] } : post
            ))
        }
        try {
            await postService.unbookmarkPost(postId)
        } catch (err) {
            console.error('Error removing bookmark:', err)
            setPosts(previousPosts)
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
        bookmarkPost,
        unbookmarkPost,
        deletePost,
        refetch: fetchPosts,
    }
}
