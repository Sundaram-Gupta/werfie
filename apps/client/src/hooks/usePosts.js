import axios from 'axios'
import { createSocketWithRecovery } from '@/lib/socketWithRecovery'
import api from '@/lib/api'
import { postService, userService, authService, announcementService } from '@/services/api'
import { getGatewayUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect, useRef, useCallback } from 'react'

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

const POSTS_STORAGE_PREFIX = 'werfie:posts:v1:'

function readPersistedPosts(tab, userId) {
    if (tab === 'for-you' || tab === 'following') {
        try {
            // On hard browser reload, we NO LONGER wipe the stale 'for-you' cache.
            // This allows the feed to load "instantly" from sessionStorage.
            // A background refresh will later pull fresh posts.
            
            const val = sessionStorage.getItem(POSTS_STORAGE_PREFIX + tab)
            let parsed = val ? JSON.parse(val) : []
            if (tab === 'for-you' && Array.isArray(parsed) && parsed.length > 0) {
                // Shuffle the cached posts on reload for a fresh layout instantly
                parsed = interleaveRandomNoAdjacent(shuffleInPlace(parsed), postUserKey)
            }
            return parsed
        } catch { return [] }
    }
    return []
}

function writePersistedPosts(tab, userId, items) {
    if (tab === 'for-you' || tab === 'following') {
        try {
            sessionStorage.setItem(POSTS_STORAGE_PREFIX + tab, JSON.stringify((items || []).slice(0, 50)))
        } catch {}
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
        let total = 0
        let max = 0
        for (const k of keys) {
            const c = groups.get(k)?.length || 0
            if (c > max) max = c
            total += c
        }
        if (total === 0) break

        const criticalLimit = Math.ceil(total / 2)
        const candidates = []

        // If one bucket dominates (>50%), they MUST be picked to prevent back-to-back clumping later
        if (max >= criticalLimit) {
            for (const k of keys) {
                if ((groups.get(k)?.length || 0) >= criticalLimit && k !== prevKey) candidates.push(k)
            }
        }

        // Proportional probability selection for fairer top-post randomization
        if (candidates.length === 0) {
            for (const k of keys) {
                const c = groups.get(k)?.length || 0
                if (c > 0 && k !== prevKey) {
                    for (let i = 0; i < c; i++) candidates.push(k)
                }
            }
        }

        // If we must, allow prevKey (unavoidable)
        if (candidates.length === 0) {
            for (const k of keys) {
                if ((groups.get(k)?.length || 0) > 0) candidates.push(k)
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
    const { noFetch } = params
    const [posts, setPosts] = useState(() => readPersistedPosts(params.tab, params.userId))
    const [loading, setLoading] = useState(() => {
        const cached = readPersistedPosts(params.tab, params.userId)
        return cached.length === 0
    })
    const [error, setError] = useState(null)
    const [nextCursor, setNextCursor] = useState(null)
    const [hasMore, setHasMore] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const followingSeedRef = useRef(Math.floor(Math.random() * 1000000))
    const forYouSeedRef = useRef(Math.floor(Math.random() * 1000000))
    const [pendingPosts, setPendingPosts] = useState([])

    const isMounted = useRef(true)
    useEffect(() => {
        isMounted.current = true
        return () => { isMounted.current = false }
    }, [])

    const seenIdsRef = useRef(null)
    const offsetRef = useRef(0)
    const fetchCtrlRef = useRef(null)
    const pinnedPostIdRef = useRef(null)
    const warnedTimeoutRef = useRef(false)
    const hasMoreRef = useRef(false)
    const nextCursorRef = useRef(null)
    const isLoadingRef = useRef(false)
    const isLoadingMoreRef = useRef(false)

    // Destructure params to ensure stable dependencies for useCallback
    const tabVal = params.tab
    const userIdVal = params.userId
    const excludeRepliesVal = params.excludeReplies
    const limitVal = params.limit
    const communityIdVal = params.communityId
    const searchVal = params.search
    const topLevelOnlyVal = params.topLevelOnly
    if (seenIdsRef.current == null) seenIdsRef.current = readSeenIds()
    // We no longer read the offset from sessionStorage on mount to ensure 
    // that every browser refresh starts fresh at the top of the feed.
    if (!offsetRef.current) offsetRef.current = 0

    const markSeen = useCallback((items) => {
        const seen = seenIdsRef.current
        for (const it of items || []) {
            const id = it?.id
            if (id != null) seen.add(String(id))
        }
        writeSeenIds(seen)
    }, [])

    const filterUnseen = useCallback((items) => {
        const seen = seenIdsRef.current
        return (items || []).filter(it => {
            const id = it?.id
            if (id == null) return false
            const key = String(id)
            return !seen.has(key)
        })
    }, [])

    // Initial load: fetch an unseen page and REPLACE feed state.
    // Guarantees: after a browser reload, feed shows different posts (if available),
    // by using persisted `seenPostIds` + `offset` as a best-effort cursor.
    const fetchPosts = useCallback(async (isSilent = false) => {
        if (!tabVal) return
        try {
            // Avoid overlapping requests
            if (fetchCtrlRef.current) fetchCtrlRef.current.abort()
            const ctrl = new AbortController()
            fetchCtrlRef.current = ctrl

            if (!isSilent) setLoading(true)
            setError(null)

            const baseParams = {
                tab: tabVal,
                userId: userIdVal,
                excludeReplies: excludeRepliesVal,
                topLevelOnly: topLevelOnlyVal,
                communityId: communityIdVal,
                search: searchVal
            }

            let data;
            let announcementsData = [];

            if (tabVal === 'bookmarks') {
                const res = await postService.getBookmarks({ ...baseParams, limit: 50 })
                data = Array.isArray(res) ? res : (res?.posts || [])
            } else if (tabVal === 'following') {
                data = await postService.getFollowingPosts({ 
                    limit: FEED_PAGE_SIZE, 
                    seed: followingSeedRef.current,
                    _ts: Date.now() 
                })
            } else if (tabVal === 'for-you') {
                // Generate a fresh seed for every new starting fetch
                forYouSeedRef.current = Math.floor(Math.random() * 1000000)
                
                data = await api.get('/api/posts', {
                    params: { ...baseParams, limit: FEED_PAGE_SIZE, seed: forYouSeedRef.current, _ts: Date.now() },
                    timeout: 10000,
                    signal: ctrl.signal,
                }).then(r => r.data)

                announcementsData = await api.get('/api/announcements/feed', {
                    params: { _ts: Date.now() },
                    timeout: 8000,
                    signal: ctrl.signal,
                }).then(r => r.data).then(d => (Array.isArray(d) ? d : (d?.posts || []))).catch(() => [])
            } else {
                data = await api.get('/api/posts', {
                    params: { ...baseParams, limit: limitVal ?? FEED_PAGE_SIZE, offset: offsetRef.current || 0, _ts: Date.now() },
                    timeout: 20000,
                    signal: ctrl.signal,
                }).then(r => r.data)
            }

            if (!isMounted.current) return

            let fetchedPosts = [];
            let next = null;
            let more = false;
            if (Array.isArray(data)) {
                fetchedPosts = data;
            } else if (data && Array.isArray(data.posts)) {
                fetchedPosts = data.posts;
                next = data.nextCursor ?? null;
                more = !!data.hasMore;
            }

            if (tabVal === 'for-you') {
                const unseen = filterUnseen(fetchedPosts)
                if (unseen.length < 5 && fetchedPosts.length >= FEED_PAGE_SIZE) {
                    setTimeout(() => refreshNewPosts(), 500)
                }
                fetchedPosts = interleaveRandomNoAdjacent(fetchedPosts, postUserKey)
            }

            if (tabVal === 'bookmarks') {
                fetchedPosts = fetchedPosts.map(p => ({ ...p, bookmarks: p.bookmarks?.length ? p.bookmarks : [{ id: 'bookmarked' }] }))
            }

            const annotatedAnnouncements = announcementsData.map(ann => ({ ...ann, isOfficialAnnouncement: true }));
            if (tabVal !== 'bookmarks') {
                fetchedPosts = [...fetchedPosts, ...annotatedAnnouncements];
                if (tabVal !== 'for-you') {
                    fetchedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
            } else {
                fetchedPosts = [...fetchedPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            fetchedPosts = await hydratePosts(dedupeById(fetchedPosts));
            fetchedPosts = ensureNoConsecutiveSameUser(fetchedPosts, postUserKey);

            if (!isMounted.current) return
            setPosts(prev => {
                const prevList = Array.isArray(prev) ? prev : []
                // If we already have posts (e.g. from cache) and it's the discovery feed,
                // merging unseen posts prevents the DOM from completely replacing and jumping.
                if (tabVal === 'for-you' && prevList.length > 0) {
                    const unseenNew = filterUnseen(fetchedPosts)
                    if (unseenNew.length === 0) return prevList
                    const newBatch = interleaveRandomNoAdjacent(unseenNew, postUserKey)
                    return ensureNoConsecutiveSameUser(dedupeById([...newBatch, ...prevList]), postUserKey)
                }
                return fetchedPosts
            })
            markSeen(fetchedPosts.filter(p => !p?.isOfficialAnnouncement))
            setNextCursor(next)
            nextCursorRef.current = next
            setHasMore(more)
            hasMoreRef.current = more
        } catch (err) {
            if (axios.isCancel(err)) return
            if (!isMounted.current) return
            setError(err?.response?.data?.details || err?.message || 'Failed to load feed')
            console.error('[usePosts] fetchPosts error:', err)
        } finally {
            if (isMounted.current) {
                if (!isSilent) {
                    setLoading(false)
                    isLoadingRef.current = false
                }
            }
        }
    }, [tabVal, userIdVal, excludeRepliesVal, limitVal, communityIdVal, searchVal, topLevelOnlyVal, filterUnseen, markSeen])

    // Refresh: fetch latest, PREPEND only unseen posts.
    // If no unseen posts exist, optionally fetch older pages using offset to still show different content.
    const refresh = useCallback(async () => {
        forYouSeedRef.current = Math.floor(Math.random() * 1000000)
        followingSeedRef.current = Math.floor(Math.random() * 1000000)
        offsetRef.current = 0
        return fetchPosts()
    }, [fetchPosts])

    const refreshNewPosts = async () => {
        try {
            // If already loading or fetching, don't spam background refreshes
            if (loading || loadingMore) return;
            // Avoid overwriting bookmarks/search results with generic post publication updates.
            // Bookmarks should be updated via bookmark/unbookmark actions and reload.
            if (params.tab === 'bookmarks') return;

            // 1) Try latest first
            let res;
            const fetchParams = { ...params, limit: FEED_PAGE_SIZE, _ts: Date.now() };
            
            if (params.tab === 'following') {
                res = await postService.getFollowingPosts({ ...fetchParams, seed: followingSeedRef.current })
            } else if (params.tab === 'for-you') {
                res = await api.get('/api/posts', { 
                    params: { ...fetchParams, seed: forYouSeedRef.current } 
                }).then(r => r.data)
            } else {
                res = await postService.getPosts({ ...fetchParams, offset: 0 })
            }
            
            const raw = res?.posts ?? (Array.isArray(res) ? res : [])
            let unseen = filterUnseen(raw)

            if (unseen.length === 0) return

            // Default: newest-first. For "for-you", we randomize with constraint.
            unseen.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            const hydrated = await hydratePosts(unseen)
            
            setPendingPosts(prev => dedupeById([...(hydrated || []), ...(prev || [])]))
        } catch (err) {
            console.error('[usePosts] refreshNewPosts error:', err)
        }
    }

    const showPendingPosts = () => {
        if (pendingPosts.length === 0) return
        
        setPosts(prev => {
            const prevList = Array.isArray(prev) ? prev : []
            let nextList
            if (params.tab === 'for-you') {
                const firstPrevKey = prevList[0] ? postUserKey(prevList[0]) : null
                let newBatch = interleaveRandomNoAdjacent(pendingPosts || [], postUserKey)
                newBatch = avoidBoundarySameUser(newBatch, firstPrevKey, postUserKey)
                nextList = dedupeById([...(newBatch || []), ...(prevList || [])])
            } else {
                nextList = dedupeById([...(pendingPosts || []), ...(prevList || [])])
            }
            const ensured = ensureNoConsecutiveSameUser(nextList, postUserKey)

            // Preserve the pinned newly-created post at index 0 (if user just created one)
            const pinId = pinnedPostIdRef.current
            if (pinId) {
                const idx = (ensured || []).findIndex(p => String(p?.id) === pinId)
                if (idx > 0) {
                    const pinned = ensured[idx]
                    ensured.splice(idx, 1)
                    ensured.unshift(pinned)
                }
            }

            return ensured
        })
        
        markSeen(pendingPosts)
        setPendingPosts([])
        // Scroll to top is handled by the component
    }

    const loadMore = useCallback(async () => {
        const currentCursor = nextCursorRef.current
        const canLoadMore = hasMoreRef.current
        if (!currentCursor || isLoadingMoreRef.current || !canLoadMore) return
        
        isLoadingMoreRef.current = true
        setLoadingMore(true)
        try {
            let data;
            if (tabVal === 'for-you') {
                data = await api.get('/api/posts', { 
                    params: { limit: FEED_PAGE_SIZE, cursor: currentCursor, seed: forYouSeedRef.current } 
                }).then(r => r.data)
            } else if (tabVal === 'following') {
                data = await postService.getFollowingPosts({ 
                    limit: FEED_PAGE_SIZE, 
                    cursor: currentCursor,
                    seed: followingSeedRef.current
                })
            } else if (tabVal === 'bookmarks') {
                data = await postService.getBookmarks({
                    limit: FEED_PAGE_SIZE,
                    cursor: currentCursor,
                    search: searchVal,
                    // Backend derives userId from auth token; extra fields are harmless.
                    tab: tabVal,
                    userId: userIdVal,
                })
            } else {
                data = await postService.getPosts({ 
                    tab: tabVal, userId: userIdVal, 
                    limit: FEED_PAGE_SIZE, cursor: currentCursor 
                })
            }

            if (!isMounted.current) return

            const raw = data?.posts ?? (Array.isArray(data) ? data : [])
            const unseen = filterUnseen(raw)
            const hydrated = await hydratePosts(unseen)
            const next = data?.nextCursor ?? null
            const more = !!data?.hasMore
            
            setPosts(prev => {
                const prevList = Array.isArray(prev) ? prev : []
                let nextList
                if (tabVal === 'for-you') {
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
            nextCursorRef.current = next
            setHasMore(more)
            hasMoreRef.current = more
        } catch (err) {
            console.error('[usePosts] loadMore error:', err)
        } finally {
            if (isMounted.current) {
                setLoadingMore(false)
                isLoadingMoreRef.current = false
            }
        }
    }, [tabVal, userIdVal, fetchPosts, searchVal])

    // 1. Tab/User/Search change: reset feed or load from cache (SWR start)
    useEffect(() => {
        // If we have a search query, we don't load from general cache as it's inaccurate.
        const cached = !searchVal ? readPersistedPosts(tabVal, userIdVal) : []
        setPosts(cached)
        setLoading(cached.length === 0)
        setError(null)
        setNextCursor(null)
        setHasMore(false)
        setPendingPosts([])
    }, [tabVal, userIdVal, searchVal])

    // 2. Initial/Tab-change/Search-change Fetch
    useEffect(() => {
        // We always trigger a fetch to keep things fresh.
        // If we have cached posts, this will be a "silent" background fetch that
        // prepends/merges new content without a full skeleton flash.
        // searchVal is included so typing in search fires a new request immediately.
        if (!noFetch) {
            fetchPosts()
        }
    }, [tabVal, userIdVal, excludeRepliesVal, noFetch, fetchPosts, searchVal])

    // 3. Persist state changes back to storage
    // We only react to posts changing to avoid overwrite race conditions during tab transition
    useEffect(() => {
        if (posts.length > 0) {
            writePersistedPosts(tabVal, userIdVal, posts)
        }
    }, [posts, tabVal, userIdVal])

    const fetchRef = useRef(fetchPosts)
    fetchRef.current = fetchPosts
    useEffect(() => {
        const onRefresh = () => refreshNewPosts()
        window.addEventListener('feed-refresh', onRefresh)
        return () => window.removeEventListener('feed-refresh', onRefresh)
    }, [])

    // Full refresh: always re-fetch/rebuild the feed state (even if no unseen posts exist).
    // Used for UX actions like clicking the sidebar Home button while already on "/".
    useEffect(() => {
        const onFullRefresh = () => refresh()
        window.addEventListener('feed-full-refresh', onFullRefresh)
        return () => window.removeEventListener('feed-full-refresh', onFullRefresh)
    }, [])

    // Feed live updates use Socket.IO (Engine.IO `EIO=4`), not a plain WebSocket.
    // Connect directly to the gateway to avoid proxy/WebSocket upgrade quirks.
    useEffect(() => {
        if (noFetch) return
        
        const raw = localStorage.getItem('accessToken')
        const token = raw ? raw.trim().replace(/\s+/g, ' ') : null

        // If not logged in, skip opening a noisy socket connection.
        if (!token) return

        const gateway = getGatewayUrl()
        const socket = createSocketWithRecovery(`${gateway}/feed`, {
            auth: { token },
            transports: ['polling'],
            upgrade: false,
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
    }, [noFetch])

    const createPost = async (content, mediaUrls = [], replyToId = null) => {
        try {
            const newPost = await postService.createPost(content, mediaUrls, replyToId)
            pinnedPostIdRef.current = newPost?.id != null ? String(newPost.id) : null
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
            // Do NOT mark as seen yet. The feed uses persisted `seenPostIds` to filter posts.
            // Marking optimistic posts as "seen" causes them to be filtered out on the next refresh/reload.
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
        pendingPosts,
        showPendingPosts,
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
