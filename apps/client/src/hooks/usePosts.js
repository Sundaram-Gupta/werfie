import { io } from 'socket.io-client'
import api from '@/lib/api'
import { postService, userService, authService, announcementService } from '@/services/api'
import { getGatewayUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect, useRef } from 'react'

// Use same-origin when unset so Vite proxies /api (REST). WebSockets use getGatewayUrl() to hit gateway directly.
const API_URL = import.meta.env.VITE_API_URL || ''

const FEED_PAGE_SIZE = 30

function dedupeById(items) {
    const seen = new Set()
    const out = []
    for (const it of items || []) {
        const id = it?.id
        const key = id == null ? null : String(id)
        if (!key) continue
        if (seen.has(key)) continue
        seen.add(key)
        out.push(it)
    }
    return out
}

const SEEN_IDS_STORAGE_KEY = 'werfie:seenPostIds:v1'
const OFFSET_STORAGE_KEY = 'werfie:postsOffset:v1'
const MAX_SEEN_IDS = 800

function readSeenIds() {
    try {
        const raw = sessionStorage.getItem(SEEN_IDS_STORAGE_KEY)
        const arr = raw ? JSON.parse(raw) : []
        const set = new Set(Array.isArray(arr) ? arr.map(String) : [])
        return set
    } catch {
        return new Set()
    }
}

function writeSeenIds(set) {
    try {
        const arr = Array.from(set).slice(-MAX_SEEN_IDS)
        sessionStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(arr))
    } catch {
        // ignore
    }
}

function readOffset() {
    try {
        const v = parseInt(sessionStorage.getItem(OFFSET_STORAGE_KEY) || '0', 10)
        return Number.isFinite(v) && v > 0 ? v : 0
    } catch {
        return 0
    }
}

function writeOffset(v) {
    try {
        sessionStorage.setItem(OFFSET_STORAGE_KEY, String(v || 0))
    } catch {
        // ignore
    }
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

// Randomized feed with "no consecutive same user" constraint.
// Best-effort: only allows adjacency when unavoidable (e.g., one user's posts dominate what's left).
function interleaveRandomNoAdjacent(items, getKey, opts = {}) {
    const list = Array.isArray(items) ? items.slice() : []
    if (list.length <= 2) return shuffleInPlace(list)

    // Group by key
    const groups = new Map() // key -> array of items
    for (const it of list) {
        const k = String(getKey?.(it) ?? '')
        if (!k) continue
        const arr = groups.get(k)
        if (arr) arr.push(it)
        else groups.set(k, [it])
    }

    const keys = Array.from(groups.keys())
    if (keys.length <= 1) return shuffleInPlace(list)

    // Randomize within each user's posts
    for (const k of keys) shuffleInPlace(groups.get(k))

    // Helper: pick random among best candidates (max remaining)
    let prevKey = opts?.prevKey != null ? String(opts.prevKey) : null
    const out = []

    while (out.length < list.length) {
        // Find max remaining count
        let max = 0
        for (const k of keys) {
            const c = groups.get(k)?.length || 0
            if (c > max) max = c
        }
        if (max === 0) break

        // Candidates: keys with max remaining, excluding prevKey when possible
        const candidates = []
        for (const k of keys) {
            const c = groups.get(k)?.length || 0
            if (c !== max) continue
            if (k === prevKey) continue
            candidates.push(k)
        }

        // If we must, allow prevKey (unavoidable)
        if (candidates.length === 0) {
            for (const k of keys) {
                const c = groups.get(k)?.length || 0
                if (c === max) candidates.push(k)
            }
        }

        // Pick random candidate among equals
        const pick = candidates[Math.floor(Math.random() * candidates.length)]
        const bucket = groups.get(pick)
        const nextItem = bucket?.shift()
        if (!nextItem) continue
        out.push(nextItem)
        prevKey = pick
    }

    // If anything was skipped due to missing keys, append it (shouldn't happen in normal usage)
    if (out.length !== list.length) {
        const seen = new Set(out.map(x => x?.id != null ? String(x.id) : null).filter(Boolean))
        for (const it of list) {
            const id = it?.id != null ? String(it.id) : null
            if (id && !seen.has(id)) out.push(it)
        }
    }

    return out
}

// Ensure the last item of `head` doesn't have the same key as `nextKey` (boundary fix).
// Does a single pass swap from the end; does not reshuffle the whole list.
function avoidBoundarySameUser(head, nextKey, getKey) {
    const list = Array.isArray(head) ? head.slice() : []
    if (!nextKey || list.length < 2) return list
    const forbidden = String(nextKey)
    const lastKey = String(getKey(list[list.length - 1]) ?? '')
    if (!lastKey || lastKey !== forbidden) return list

    for (let i = list.length - 2; i >= 0; i--) {
        const k = String(getKey(list[i]) ?? '')
        if (k && k !== forbidden) {
            const tmp = list[i]
            list[i] = list[list.length - 1]
            list[list.length - 1] = tmp
            return list
        }
    }
    return list
}

// Universal pass: reorder so no two consecutive posts have the same user key.
// Used for all tabs so the feed never shows back-to-back posts from one user.
function ensureNoConsecutiveSameUser(list, getKey) {
    const arr = Array.isArray(list) ? list.slice() : []
    if (arr.length < 2) return arr
    const key = (it) => String(getKey?.(it) ?? '')
    let changed = true
    for (let pass = 0; pass < 5 && changed; pass++) {
        changed = false
        for (let i = 1; i < arr.length; i++) {
            if (key(arr[i]) !== key(arr[i - 1])) continue
            const want = key(arr[i])
            let swapped = false
            for (let j = i + 1; j < arr.length; j++) {
                if (key(arr[j]) !== want) {
                    ;[arr[i], arr[j]] = [arr[j], arr[i]]
                    swapped = true
                    changed = true
                    break
                }
            }
            if (!swapped) {
                for (let j = i - 2; j >= 0; j--) {
                    if (key(arr[j]) !== want) {
                        ;[arr[i], arr[j]] = [arr[j], arr[i]]
                        changed = true
                        break
                    }
                }
            }
        }
    }
    return arr
}

function postUserKey(p) {
    if (p?.isOfficialAnnouncement) return `ann:${p?.id ?? ''}`
    const uid = p?.userId ?? p?.user?.id ?? ''
    // Fallback to post id so missing user data doesn't collapse different users into one key
    return uid !== '' && uid != null ? String(uid) : `post:${p?.id ?? ''}`
}

function normalizeUser(u, defaultId) {
    if (!u) return { id: defaultId, name: 'User', handle: 'user', email: null, profile: null };
    const emailPrefix = (u.email || '').split('@')[0] || '';
    const handle = u.profile?.handle || u.handle || emailPrefix || 'user';
    const name = u.profile?.name || u.name || (handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'User');
    return { ...u, name, handle, profile: u.profile || { name, handle, avatar: null } };
}

async function hydratePosts(fetchedPosts) {
    // Most feeds already include `user` + `profile` from backend includes.
    // Only fetch user profiles for posts that are missing usable user data.
    const userIds = [
        ...new Set(
            fetchedPosts
                .filter(item => {
                    if (!item || item.isOfficialAnnouncement) return false
                    if (!item.userId) return false
                    const u = item.user
                    const hasHandle = !!(u?.profile?.handle || u?.handle)
                    const hasName = !!(u?.profile?.name || u?.name)
                    const hasEmail = !!u?.email
                    // If backend already provided identity fields, don't refetch.
                    return !(hasHandle || hasName || hasEmail)
                })
                .map(item => item.userId)
        )
    ];
    let userMap = {};
    if (userIds.length > 0) {
        try {
            const users = await userService.getUsers(userIds);
            (Array.isArray(users) ? users : []).forEach(user => { userMap[user.id] = user; });
        } catch (err) {
            console.warn('Failed to fetch user profiles for posts:', err?.response?.data?.details || err?.message);
        }
    }
    return fetchedPosts.map(item => {
        if (item.isOfficialAnnouncement) return item;
        const bookmarks = Array.isArray(item.bookmarks) ? item.bookmarks : [];
        const existing = item.user;
        const fromMap = userMap[item.userId] || userMap[String(item.userId)];
        const resolvedUser = normalizeUser(existing || fromMap || { id: item.userId }, item.userId);
        return { ...item, bookmarks, user: resolvedUser };
    });
}

export function usePosts(params = {}) {
    const { user: currentUser } = useAuth()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [nextCursor, setNextCursor] = useState(null)
    const [hasMore, setHasMore] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)

    const seenIdsRef = useRef(null)
    const offsetRef = useRef(0)
    const fetchCtrlRef = useRef(null)
    const warnedTimeoutRef = useRef(false)
    if (seenIdsRef.current == null) seenIdsRef.current = readSeenIds()
    if (!offsetRef.current) offsetRef.current = readOffset()

    const markSeen = (items) => {
        const seen = seenIdsRef.current
        for (const it of items || []) {
            const id = it?.id
            if (id != null) seen.add(String(id))
        }
        writeSeenIds(seen)
    }

    const filterUnseen = (items) => {
        const seen = seenIdsRef.current
        return (items || []).filter(it => {
            const id = it?.id
            if (id == null) return false
            const key = String(id)
            return !seen.has(key)
        })
    }

    // Initial load: fetch an unseen page and REPLACE feed state.
    // Guarantees: after a browser reload, feed shows different posts (if available),
    // by using persisted `seenPostIds` + `offset` as a best-effort cursor.
    const fetchPosts = async (silent = false) => {
        try {
            // Avoid overlapping requests piling up (common cause of Axios 30s timeout spam)
            try { fetchCtrlRef.current?.abort?.() } catch {}
            const ctrl = new AbortController()
            fetchCtrlRef.current = ctrl

            if (!silent) setLoading(true)
            if (!silent) setPosts([]) // browser reload: new session state, so OK to reset UI here
            setError(null)
            setNextCursor(null)
            setHasMore(false)
            let data;
            let announcementsData = [];
            // Home feed should be top-level only by default (replyToId IS NULL)
            const baseParams = (params.tab === 'for-you' || params.tab === 'following')
                ? { ...params, excludeReplies: params.excludeReplies ?? true }
                : { ...params }

            if (params.tab === 'bookmarks') {
                const res = await postService.getBookmarks({ limit: 50 })
                data = Array.isArray(res) ? res : (res?.posts || [])
            } else if (params.tab === 'following') {
                data = await postService.getFollowingPosts({ limit: FEED_PAGE_SIZE, _ts: Date.now() })
            } else if (params.tab === 'for-you') {
                // For "For you" we want: different posts on every browser refresh + no repeats.
                // Use offset cursor (persisted in sessionStorage) + seenPostIds to page through unseen content.
                const startOffset = offsetRef.current || 0

                data = await api.get('/api/posts', {
                    params: { ...baseParams, limit: FEED_PAGE_SIZE, offset: startOffset, _ts: Date.now() },
                    timeout: 20000,
                    signal: ctrl.signal,
                }).then(r => r.data)

                announcementsData = await api.get('/api/announcements/feed', {
                    params: { _ts: Date.now() },
                    timeout: 8000,
                    signal: ctrl.signal,
                }).then(r => r.data).then(d => (Array.isArray(d) ? d : (d?.posts || []))).catch(() => [])
            } else {
                data = await api.get('/api/posts', {
                    params: { ...baseParams, limit: params.limit ?? FEED_PAGE_SIZE, offset: offsetRef.current || 0, _ts: Date.now() },
                    timeout: 20000,
                    signal: ctrl.signal,
                }).then(r => r.data)
            }
            let fetchedPosts = [];
            let next = null;
            let more = false;
            if (Array.isArray(data)) {
                fetchedPosts = data;
            } else if (data && Array.isArray(data.posts)) {
                fetchedPosts = data.posts;
                if (data.nextCursor != null) next = data.nextCursor;
                if (data.hasMore != null) more = data.hasMore;
            }

            // For "For you": enforce no-repeat + randomized order (no consecutive same-user).
            if (params.tab === 'for-you') {
                let unseen = filterUnseen(fetchedPosts)
                let attempts = 0
                while (unseen.length < FEED_PAGE_SIZE && attempts < 6) {
                    if (unseen.length >= FEED_PAGE_SIZE) break
                    offsetRef.current = (offsetRef.current || 0) + FEED_PAGE_SIZE
                    writeOffset(offsetRef.current)
                    const nextPage = await api.get('/api/posts', {
                        params: { ...baseParams, limit: FEED_PAGE_SIZE, offset: offsetRef.current, _ts: Date.now() },
                        timeout: 20000,
                        signal: ctrl.signal,
                    }).then(r => r.data)
                    const nextRaw = nextPage?.posts ?? (Array.isArray(nextPage) ? nextPage : [])
                    const nextUnseen = filterUnseen(nextRaw)
                    unseen = dedupeById([...(unseen || []), ...(nextUnseen || [])])
                    attempts++
                    if (nextRaw.length < FEED_PAGE_SIZE) break
                }

                fetchedPosts = interleaveRandomNoAdjacent(unseen.slice(0, FEED_PAGE_SIZE), postUserKey)
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
                fetchedPosts = [...fetchedPosts, ...annotatedAnnouncements];
                
                // Only sort chronologically if NOT the random "For You" feed
                if (params.tab !== 'for-you') {
                    fetchedPosts.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                }
            } else {
                fetchedPosts = [...fetchedPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            fetchedPosts = dedupeById(fetchedPosts)
            // Enforce "different posts on every reload" for normal feeds:
            // filter out already-seen posts, and if none left, advance offset until we find unseen.
            if (params.tab !== 'bookmarks' && params.tab !== 'for-you') {
                let unseen = filterUnseen(fetchedPosts.filter(p => !p?.isOfficialAnnouncement))
                let attempts = 0
                while (unseen.length === 0 && attempts < 5) {
                    offsetRef.current = (offsetRef.current || 0) + FEED_PAGE_SIZE
                    writeOffset(offsetRef.current)
                    const nextPage = await api.get('/api/posts', {
                        params: {
                            ...baseParams,
                        limit: params.limit ?? FEED_PAGE_SIZE,
                        offset: offsetRef.current,
                        _ts: Date.now(),
                        },
                        timeout: 20000,
                        signal: ctrl.signal,
                    }).then(r => r.data)
                    const nextRaw = nextPage?.posts ?? (Array.isArray(nextPage) ? nextPage : [])
                    unseen = filterUnseen(nextRaw)
                    attempts++
                }

                // Keep announcements (optional) + unseen posts only
                const onlyUnseen = dedupeById([
                    ...annotatedAnnouncements,
                    ...unseen,
                ])
                fetchedPosts = onlyUnseen
            }

            fetchedPosts = await hydratePosts(fetchedPosts);
            fetchedPosts = ensureNoConsecutiveSameUser(fetchedPosts, postUserKey);

            setPosts(fetchedPosts)
            markSeen(fetchedPosts.filter(p => !p?.isOfficialAnnouncement))
            setNextCursor(next)
            setHasMore(!!more)
        } catch (err) {
            // Request cancellation is expected in dev (React StrictMode double-invokes effects)
            // and when we abort previous in-flight requests. Do not surface as an error UI.
            const isCanceled =
                String(err?.name || '') === 'CanceledError' ||
                String(err?.code || '') === 'ERR_CANCELED' ||
                /canceled|cancelled/i.test(String(err?.message || '')) ||
                String(err?.name || '') === 'AbortError'
            if (isCanceled) return

            const msg = err?.response?.data?.details || err?.message || 'Failed to load feed'
            setError(msg)

            const isTimeout = String(err?.code || '').toUpperCase() === 'ECONNABORTED' || /timeout/i.test(String(err?.message || ''))
            if (isTimeout) {
                if (!warnedTimeoutRef.current) {
                    warnedTimeoutRef.current = true
                    console.warn('[usePosts] API timeout (30s). This happens when the gateway/services are down, or many overlapping requests were triggered while scrolling/refreshing. We now abort old requests and keep the UI stable.')
                }
            } else if (String(err?.name || '') !== 'CanceledError') {
                console.error('Error fetching posts:', err)
            }
        } finally {
            if (!silent) setLoading(false)
        }
    }

    // Refresh: fetch latest, PREPEND only unseen posts.
    // If no unseen posts exist, optionally fetch older pages using offset to still show different content.
    const refreshNewPosts = async () => {
        try {
            setError(null)

            // 1) Try latest first
            const res = await postService.getPosts({ ...params, limit: FEED_PAGE_SIZE, offset: 0, _ts: Date.now() })
            const raw = res?.posts ?? (Array.isArray(res) ? res : [])
            let unseen = filterUnseen(raw)

            // 2) If none, advance offset until we find unseen (best-effort)
            let attempts = 0
            while (unseen.length === 0 && attempts < 3) {
                offsetRef.current = (offsetRef.current || 0) + FEED_PAGE_SIZE
                writeOffset(offsetRef.current)
                const older = await postService.getPosts({
                    ...params,
                    limit: FEED_PAGE_SIZE,
                    offset: offsetRef.current,
                    _ts: Date.now()
                })
                const olderRaw = older?.posts ?? (Array.isArray(older) ? older : [])
                unseen = filterUnseen(olderRaw)
                attempts++
            }

            if (unseen.length === 0) return

            // Default: newest-first. For "for-you", we randomize with constraint.
            unseen.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            const hydrated = await hydratePosts(unseen)

            setPosts(prev => {
                const prevList = Array.isArray(prev) ? prev : []
                let nextList
                if (params.tab === 'for-you') {
                    const firstPrevKey = prevList[0] ? postUserKey(prevList[0]) : null
                    let newBatch = interleaveRandomNoAdjacent(hydrated || [], postUserKey)
                    newBatch = avoidBoundarySameUser(newBatch, firstPrevKey, postUserKey)
                    nextList = dedupeById([...(newBatch || []), ...(prevList || [])])
                } else {
                    nextList = dedupeById([...(hydrated || []), ...(prevList || [])])
                }
                return ensureNoConsecutiveSameUser(nextList, postUserKey)
            })
            markSeen(unseen)
        } catch (err) {
            console.error('[usePosts] refreshNewPosts error:', err)
        }
    }

    const loadMore = async () => {
        if (!nextCursor || loadingMore || !hasMore) return
        setLoadingMore(true)
        try {
            let data;
            if (params.tab === 'for-you') {
                data = await authService.getFeed({ limit: FEED_PAGE_SIZE, cursor: nextCursor })
            } else if (params.tab === 'following') {
                data = await postService.getFollowingPosts({ limit: FEED_PAGE_SIZE, cursor: nextCursor })
            } else {
                data = await postService.getPosts({ ...params, limit: FEED_PAGE_SIZE, cursor: nextCursor })
            }
            const raw = data?.posts ?? (Array.isArray(data) ? data : [])
            const unseen = filterUnseen(raw)
            const hydrated = await hydratePosts(unseen)
            const next = data?.nextCursor ?? null
            const more = !!data?.hasMore
            setPosts(prev => {
                const prevList = Array.isArray(prev) ? prev : []
                let nextList
                if (params.tab === 'for-you') {
                    const lastPrevKey = prevList.length ? postUserKey(prevList[prevList.length - 1]) : null
                    const batch = interleaveRandomNoAdjacent(hydrated || [], postUserKey, { prevKey: lastPrevKey })
                    nextList = dedupeById([...(prevList || []), ...(batch || [])])
                } else {
                    nextList = dedupeById([...(prevList || []), ...(hydrated || [])])
                }
                return ensureNoConsecutiveSameUser(nextList, postUserKey)
            })
            markSeen(unseen)
            setNextCursor(next)
            setHasMore(more)
        } catch (err) {
            console.error('Load more posts error:', err)
        } finally {
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [JSON.stringify(params)])

    const fetchRef = useRef(fetchPosts)
    fetchRef.current = fetchPosts
    useEffect(() => {
        const onRefresh = () => refreshNewPosts()
        window.addEventListener('feed-refresh', onRefresh)
        return () => window.removeEventListener('feed-refresh', onRefresh)
    }, [])

    // Feed live updates use Socket.IO (Engine.IO `EIO=4`), not a plain WebSocket.
    // Connect directly to the gateway to avoid proxy/WebSocket upgrade quirks.
    useEffect(() => {
        const raw = localStorage.getItem('accessToken')
        const token = raw ? raw.trim().replace(/\s+/g, ' ') : null

        // If not logged in, skip opening a noisy socket connection.
        if (!token) return

        const gateway = getGatewayUrl()
        const socket = io(`${gateway}/feed`, {
            path: '/ws/live',
            auth: { token },
            // IMPORTANT: Avoid browser console "WebSocket connection failed" spam by not attempting
            // a websocket upgrade when the network/proxy blocks it. Polling keeps live updates working.
            transports: ['polling'],
            upgrade: false,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 800,
            reconnectionDelayMax: 4000,
            timeout: 12000,
        })

        socket.on('post_published', () => refreshNewPosts())
        // Keep console clean: warn once per mount if it can't connect.
        let warned = false
        socket.on('connect_error', (err) => {
            if (warned) return
            warned = true
            console.warn('[usePosts] Feed socket connect_error:', err?.message || err)
        })

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
            setPosts(prev => {
                const prevList = Array.isArray(prev) ? prev : []
                const next = ensureNoConsecutiveSameUser([postWithUser, ...(prevList || [])], postUserKey)
                return next
            })
            markSeen([newPost])
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
        loadMore,
        hasMore,
        loadingMore,
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
