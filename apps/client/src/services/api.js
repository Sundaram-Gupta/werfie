import api, { API_BASE_URL, getGatewayUrl } from '@/lib/api'

export { getGatewayUrl }
import axios from 'axios'

import i18n from '@/i18n'

// Authentication Services
export const authService = {
    // Register new user
    register: async (email, password, name, handle) => {
        const preferredLanguage = i18n.language || 'en'
        const rawHandle = (handle || '').replace(/^@+/, '')
        const { data } = await api.post('/api/auth/register', {
            email,
            password,
            name,
            handle: rawHandle,
            preferredLanguage,
        }, { timeout: 15000 })

        // Normalizer extracts payload; fallback for non-standard responses
        const payload = data?.data ?? data
        localStorage.setItem('accessToken', payload.accessToken)
        localStorage.setItem('refreshToken', payload.refreshToken)
        localStorage.setItem('user', JSON.stringify(payload.user))

        return payload
    },

    // Login
    login: async (email, password) => {
        const { data } = await api.post('/api/auth/login', {
            email,
            password,
        }, { timeout: 15000 })

        const payload = data?.data ?? data
        console.log('[Frontend Login] Successfully logged in. Institutional ID:', payload.institutionalProfile?.id || 'None');

        const user = {
            id: payload.id,
            email: payload.email,
            role: payload.role || 'Viewer',
            profile: payload.profile,
            preferredLanguage: payload.preferredLanguage,
            institutionalProfile: payload.institutionalProfile
        }

        // Store tokens
        localStorage.setItem('accessToken', payload.accessToken)
        localStorage.setItem('refreshToken', payload.refreshToken)
        localStorage.setItem('user', JSON.stringify(user))

        return { ...payload, user }
    },

    // Logout
    logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
            try {
                await api.post('/api/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${refreshToken}` }
                })
            } catch (error) {
                console.error('Logout error:', error)
            }
        }

        // Clear local storage
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
    },

    getFeed: async (params = {}) => {
        const { limit = 30, cursor, random } = params
        const { data } = await api.get('/api/posts/timeline/home', {
            params: { limit, ...(cursor ? { cursor } : {}), ...(random ? { random: 1 } : {}) }
        })
        return data
    },
    changePassword: async (currentPassword, newPassword) => {
        const { data } = await api.post('/api/auth/change-password', { currentPassword, newPassword })
        return data
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const { data } = await api.get('/api/auth/me')
            return data
        } catch (error) {
            // 401/403 is expected when token is missing/expired; treat as "not logged in"
            const status = error?.response?.status
            if (status === 401 || status === 403) return null
            throw error
        }
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('accessToken')
    },

    // Get stored user
    getStoredUser: () => {
        const user = localStorage.getItem('user')
        if (!user || user === 'undefined') return null
        try {
            return JSON.parse(user)
        } catch (e) {
            console.error('Failed to parse user from localStorage:', e)
            localStorage.removeItem('user') // Clear invalid data
            return null
        }
    },
}

// Messaging API Instance - uses same origin (from lib/api) when VITE_API_URL unset
const MESSAGING_API_URL = import.meta.env.VITE_MESSAGING_URL || API_BASE_URL

const messagingApi = axios.create({
    baseURL: MESSAGING_API_URL,
    headers: { 'Content-Type': 'application/json' }
})

// Add auth token to messaging requests (trim to avoid control-char issues)
messagingApi.interceptors.request.use((config) => {
    const raw = localStorage.getItem('accessToken')
    const token = raw ? raw.trim().replace(/\s+/g, ' ') : null
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Normalize messaging API responses + handle 401 with token refresh
messagingApi.interceptors.response.use(
    (response) => {
        const d = response?.data
        if (d && typeof d === 'object' && 'status' in d && 'data' in d) {
            response.data = d.data
        }
        return response
    },
    async (error) => {
        const originalRequest = error.config
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (refreshToken) {
                    const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                        refreshToken,
                    })
                    const payload = data?.data ?? data
                    if (payload?.accessToken) {
                        localStorage.setItem('accessToken', payload.accessToken)
                        originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`
                        return messagingApi(originalRequest)
                    }
                }
            } catch {
                // Refresh failed - let error propagate
            }
        }
        return Promise.reject(error)
    }
)

// Post Services
export const postService = {
    // Get post count for current user (Creator Studio)
    getPostCount: async () => {
        const { data } = await api.get('/api/posts/count')
        return data?.count ?? data ?? 0
    },

    // Get all posts
    getPosts: async (params = {}) => {
        const { data } = await api.get('/api/posts', { params })
        return data
    },

    // Get single post
    getPost: async (postId) => {
        const { data } = await api.get(`/api/posts/${postId}`)
        return data
    },

    // Create post (with optional media, replyToId, scheduledAt)
    // Use JSON for text-only (polls, etc.) to avoid FormData/multipart parsing issues
    createPost: async (content, files = [], replyToId = null, scheduledAt = null, options = {}) => {
        const { productId, ctaLink, ctaLabel, isPinned } = options;
        const fileList = files || [];
        const contentStr = typeof content === 'string' ? content : (content != null ? String(content) : '');

        if (fileList.length === 0) {
            const payload = { content: contentStr };
            if (replyToId) payload.replyToId = replyToId;
            if (scheduledAt) payload.scheduledAt = typeof scheduledAt === 'string' ? scheduledAt : scheduledAt.toISOString();
            if (productId) payload.productId = productId;
            if (ctaLink) payload.ctaLink = ctaLink;
            if (ctaLabel) payload.ctaLabel = ctaLabel;
            if (isPinned) payload.isPinned = isPinned;
            
            const { data } = await api.post('/api/posts', payload);
            return data;
        }

        const formData = new FormData();
        formData.append('content', contentStr);
        if (replyToId) formData.append('replyToId', replyToId);
        if (scheduledAt) formData.append('scheduledAt', typeof scheduledAt === 'string' ? scheduledAt : scheduledAt.toISOString());
        if (productId) formData.append('productId', productId);
        if (ctaLink) formData.append('ctaLink', ctaLink);
        if (ctaLabel) formData.append('ctaLabel', ctaLabel);
        if (isPinned) formData.append('isPinned', 'true');
        
        fileList.forEach((file) => formData.append('media', file));

        const { data } = await api.post('/api/posts', formData);
        return data;
    },

    // Schedule post for a future time
    schedulePost: async (content, scheduledAt, files = []) => {
        return postService.createPost(content, files, null, scheduledAt);
    },

    // Get scheduled posts (Creator Studio)
    getScheduledPosts: async () => {
        const { data } = await api.get('/api/posts/scheduled');
        return Array.isArray(data) ? data : (data?.data ?? []);
    },

    // Create poll post. Format: "📊 Poll: question\n1. opt1\n2. opt2"
    createPoll: async (question, options, intro = '', files = []) => {
        if (!question?.trim() || !Array.isArray(options) || options.filter(o => o?.trim()).length < 2) {
            throw new Error('Poll needs a question and at least 2 options');
        }
        const opts = options.filter(o => o?.trim()).slice(0, 4);
        const pollText = `📊 Poll: ${question.trim()}\n${opts.map((o, i) => `${i + 1}. ${o.trim()}`).join('\n')}`;
        const content = intro.trim() ? `${intro.trim()}\n\n${pollText}` : pollText;
        return postService.createPost(content, files);
    },

    // Delete post
    deletePost: async (postId) => {
        const { data } = await api.delete(`/api/posts/${postId}`);
        return data;
    },

    // Like post
    likePost: async (postId) => {
        const { data } = await api.post(`/api/posts/${postId}/like`)
        return data
    },

    // Unlike post
    unlikePost: async (postId) => {
        const { data } = await api.delete(`/api/posts/${postId}/like`)
        return data
    },

    // Retweet post
    retweetPost: async (postId) => {
        const { data } = await api.post(`/api/posts/${postId}/retweet`)
        return data
    },

    // Unretweet post
    unretweetPost: async (postId) => {
        const { data } = await api.delete(`/api/posts/${postId}/retweet`)
        return data
    },

    // Bookmark post
    bookmarkPost: async (postId) => {
        const { data } = await api.post(`/api/posts/${postId}/bookmark`)
        return data
    },

    // Remove bookmark
    unbookmarkPost: async (postId) => {
        const { data } = await api.delete(`/api/posts/${postId}/bookmark`)
        return data
    },

    // Get bookmarked posts
    getBookmarks: async (params = {}) => {
        const { data } = await api.get('/api/posts/bookmarks', { params })
        return data
    },

    getLikedPosts: async (params = {}) => {
        const { data } = await api.get('/api/posts/liked', { params })
        return data
    },

    // Get post replies
    getReplies: async (postId, params = {}) => {
        const { data } = await api.get(`/api/posts/${postId}/replies`, { params })
        return data
    },

    // Create reply - POST /api/posts/:id/replies
    createReply: async (postId, content) => {
        const { data } = await api.post(`/api/posts/${postId}/replies`, {
            content: typeof content === 'string' ? content : String(content),
        })
        return data
    },

    // Get following feed
    getFollowingPosts: async (params = {}) => {
        const { data } = await api.get('/api/posts/following', { params })
        return data
    },
}

// User Services
export const userService = {
    // Get my profile
    getMyProfile: async () => {
        const { data } = await api.get('/api/users/profile')
        return data?.data ?? data
    },

    // Get user profile
    getUser: async (userId) => {
        const { data } = await api.get(`/api/users/${userId}`)
        return data
    },

    // Get multiple users
    getUsers: async (userIds) => {
        if (!userIds || userIds.length === 0) return []
        const { data } = await api.get('/api/users', {
            params: { ids: userIds.join(',') }
        })
        return data
    },

    // Get suggestions (paginated: page, limit; default limit 50)
    getSuggestions: async (params = {}) => {
        const { limit = 50, page = 1 } = params
        const { data } = await api.get('/api/users/suggestions', { params: { limit, page } })
        return data
    },

    // Update user profile
    updateProfile: async (userId, profileData) => {
        const { data } = await api.put(`/api/users/${userId}`, profileData)
        return data
    },

    // Follow user
    followUser: async (userId) => {
        const { data } = await api.post(`/api/users/${userId}/follow`)
        return data
    },

    // Unfollow user
    unfollowUser: async (userId) => {
        const { data } = await api.delete(`/api/users/${userId}/follow`)
        return data
    },

    // Get followers
    getFollowers: async (userId, params = {}) => {
        const { data } = await api.get(`/api/users/${userId}/followers`, { params })
        return data
    },

    // Get followers count (Creator Studio)
    getFollowersCount: async (userId) => {
        const { data } = await api.get(`/api/users/${userId}/followers-count`)
        return data?.count ?? data ?? 0
    },

    // Get following
    getFollowing: async (userId, params = {}) => {
        const { data } = await api.get(`/api/users/${userId}/following`, { params })
        return data
    },
}

// Timeline Services
export const timelineService = {
    // Get home timeline
    getHomeTimeline: async (params = {}) => {
        const { data } = await api.get('/api/posts/timeline/home', { params })
        return data
    },
}

// Notification Services
export const notificationService = {
    // Get notifications
    getNotifications: async (params = {}) => {
        const { data } = await api.get('/api/notifications', { params })
        return data
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        const { data } = await api.put(`/api/notifications/${notificationId}/read`)
        return data
    },
}

// Search Services
export const searchService = {
    // Search posts
    searchPosts: async (query, params = {}) => {
        const { data } = await api.get('/api/search/posts', {
            params: { q: query, ...params },
        })
        return data
    },

    // Search users
    searchUsers: async (query, params = {}) => {
        // Gateway routes this to user-service (/search)
        const { data } = await api.get('/api/search/users', { params: { q: query, ...params } })
        return data
    },

    // Unified search for users, posts, and media in one call
    searchUnified: async (query) => {
        const { data } = await api.get('/api/search', { params: { q: query } })
        return data
    },

    // Get Trends (spike-based hashtags from posts; optional region for "Trending in X")
    getTrends: async (params = {}) => {
        const { limit = 20, region } = params
        const { data } = await api.get('/api/trends', { params: { limit, ...(region ? { region } : {}) } })
        return Array.isArray(data) ? data : []
    },

    // Get Explore Items
    getExploreItems: async (category) => {
        const { data } = await api.get('/api/explore', { params: { category, limit: 20 } })
        return data
    },

    // Get Communities
    getCommunities: async () => {
        const { data } = await api.get('/api/communities')
        return data
    },

    // Get single community detail
    getCommunity: async (id) => {
        const { data } = await api.get(`/api/communities/${id}`)
        return data
    },

    // Join community
    joinCommunity: async (id) => {
        const { data } = await api.post(`/api/communities/${id}/join`)
        return data
    },

    // Leave community
    leaveCommunity: async (id) => {
        const { data } = await api.post(`/api/communities/${id}/leave`)
        return data
    },

    // Get Spaces
    getSpaces: async () => {
        const { data } = await api.get('/api/spaces')
        return data
    },

    // Safe fallback:
    // Some UI flows call getGeneralInsightsList(); earlier implementation removed/moved.
    // Returning [] prevents /spaces from crashing even if no dedicated endpoint exists.
    getGeneralInsightsList: async () => {
        try {
            // No known endpoint in this repo; keep as empty fallback.
            return []
        } catch (_) {
            return []
        }
    },
}

// Space Services
export const spaceService = {
    // Get all spaces
    getAll: async () => {
        const { data } = await api.get('/api/spaces')
        return data
    },

    // Create space
    createSpace: async (spaceData) => {
        const { data } = await api.post('/api/spaces', spaceData)
        return data
    },

    // Start space (if scheduled)
    startSpace: async (spaceId) => {
        const { data } = await api.post(`/api/spaces/${spaceId}/start`)
        return data
    },

    // End space
    endSpace: async (spaceId) => {
        const { data } = await api.post(`/api/spaces/${spaceId}/end`)
        return data
    },

    // Safe fallback for UI compatibility.
    getGeneralInsightsList: async () => {
        try {
            return []
        } catch (_) {
            return []
        }
    }
}

// Media Services
export const mediaService = {
    // Get user's media library (from their posts)
    getLibrary: async (params = {}) => {
        const { data } = await api.get('/api/media/library', { params })
        return data?.data ?? data ?? []
    },

    // Upload media
    uploadMedia: async (file, onProgress) => {
        const formData = new FormData()
        formData.append('file', file)

        const { data } = await api.post('/api/media/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    onProgress(percentCompleted)
                }
            }
        })
        return data
    },
}

// Messaging Services
export const messagingService = {
    // Get conversations
    getConversations: async (params = {}) => {
        const { data } = await messagingApi.get('/api/messages/conversations', { params })
        return data
    },

    // Create or get conversation
    createConversation: async (recipientId) => {
        const { data } = await messagingApi.post('/api/messages/conversations', { recipientId })
        return data
    },

    // Get single conversation
    getConversation: async (conversationId) => {
        const { data } = await messagingApi.get(`/api/messages/conversations/${conversationId}`)
        return data
    },
    getConversationSettings: async (conversationId) => {
        const { data } = await messagingApi.get(`/api/messages/conversations/${conversationId}/settings`)
        return data
    },
    updateConversationSettings: async (conversationId, payload) => {
        const { data } = await messagingApi.patch(`/api/messages/conversations/${conversationId}/settings`, payload)
        return data
    },

    // Upload Media
    uploadMedia: async (formData) => {
        const { data } = await messagingApi.post('/api/messages/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return data
    },

    // Get messages
    getMessages: async (conversationId, params = {}) => {
        const { data } = await messagingApi.get(`/api/messages/conversations/${conversationId}/messages`, { params })
        return data
    },

    // Send message (via REST fallback if socket fails, or for initial dev)
    sendMessage: async (recipientId, content) => {
        const { data } = await messagingApi.post('/api/messages/send', { recipientId, content })
        return data
    },
    deleteMessage: async (messageId) => {
        const { data } = await messagingApi.delete(`/api/messages/${messageId}`)
        return data
    },
    reactToMessage: async (messageId, emoji, isRemoving = false) => {
        if (isRemoving) {
            const { data } = await messagingApi.delete(`/api/messages/${messageId}/react`, { data: { emoji } })
            return data
        }
        const { data } = await messagingApi.post(`/api/messages/${messageId}/react`, { emoji })
        return data
    },
    replyToMessage: async (messageId, payload) => {
        const { data } = await messagingApi.post(`/api/messages/${messageId}/reply`, payload)
        return data
    },
    forwardMessage: async (messageId, targetConversationId) => {
        const { data } = await messagingApi.post(`/api/messages/${messageId}/forward`, { targetConversationId })
        return data
    },
    updateMessage: async (messageId, content) => {
        const { data } = await messagingApi.patch(`/api/messages/${messageId}`, { content })
        return data
    },
    hideMessage: async (messageId) => {
        const { data } = await messagingApi.delete(`/api/messages/${messageId}/hide`)
        return data
    },
    getMessageInfo: async (messageId) => {
        const { data } = await messagingApi.get(`/api/messages/${messageId}`)
        return data
    },
    createConversation: async (recipientId) => {
        const { data } = await messagingApi.post('/api/messages/conversations', { recipientId })
        return data
    }
}

// Analytics Services
export const analyticsService = {
    logEvent: async (event, data) => {
        try {
            await api.post('/api/analytics/events', { event, data })
        } catch (e) {
            console.error('Analytics error', e)
        }
    },
    getCreatorStats: async () => {
        const { data } = await api.get('/api/creator-studio/stats')
        return data?.data ?? data
    },
    getAudienceInsights: async (userId) => {
        const config = {}
        if (userId) {
            config.headers = { 'X-User-Id': userId }
            config.params = { userId }
        }
        const { data } = await api.get('/api/creator-studio/audience-insights', config)
        return data?.data ?? data ?? {}
    }
}

// Ad Services
export const adService = {
    getCampaigns: async () => {
        const { data } = await api.get('/api/ads/campaigns')
        return data
    },
    createCampaign: async (campaignData) => {
        const { data } = await api.post('/api/ads/campaigns', campaignData)
        return data
    },
    getPerformance: async () => {
        const { data } = await api.get('/api/ads/performance')
        return data
    }
}

// Business Services
export const businessService = {
    getAccess: async () => {
        const { data } = await api.get('/api/business/access')
        return data
    },
    createBusiness: async ({ companyName, handle }) => {
        const { data } = await api.post('/api/business/create', { companyName, handle })
        return data
    },
    completeOnboarding: async () => {
        const { data } = await api.patch('/api/business/onboarding/complete')
        return data
    },
    getBusinessById: async (id) => {
        const { data } = await api.get(`/api/business/${id}`)
        return data
    },
    inviteTeamMember: async (identifier, role = 'member') => {
        const { data } = await api.post('/api/business/team', { identifier, role })
        return data
    },
    getStats: async () => {
        const { data } = await api.get('/api/business/stats')
        return data
    },
    boostPost: async (postId) => {
        const { data } = await api.post('/api/business/boost', { postId })
        return data
    },
    getProfile: async () => {
        const { data } = await api.get('/api/business')
        // Gateway or legacy handlers may wrap as { data: profile }
        const payload = data?.data ?? data
        return payload
    },
    updateProfile: async (profileData) => {
        const { data } = await api.post('/api/business', profileData)
        const payload = data?.data ?? data
        return payload
    },
    getTeamMembers: async () => {
        const { data } = await api.get('/api/business/team')
        return data
    },
    addTeamMember: async (identifier, role = 'member') => {
        const { data } = await api.post('/api/business/team/invite', { identifier, role })
        return data
    },
    updateTeamRole: async (memberId, role) => {
        const { data } = await api.patch('/api/business/team/role', { memberId, role })
        return data
    },
    removeTeamMember: async (memberId) => {
        const { data } = await api.delete('/api/business/team/member', { data: { memberId } })
        return data
    },
    requestVerification: async () => {
        const { data } = await api.post('/api/business/request-verification')
        return data
    },
    getProducts: async (businessId) => {
        const id = businessId === 'me' ? 'products' : `${businessId}/products`
        const { data } = await api.get(`/api/business/${id}`)
        return data
    },
    addProduct: async (payload) => {
        const { data } = await api.post('/api/business/products', payload)
        return data
    },
    updateProduct: async (id, payload) => {
        const { data } = await api.put(`/api/business/products/${id}`, payload)
        return data
    },
    deleteProduct: async (id) => {
        const { data } = await api.delete(`/api/business/products/${id}`)
        return data
    },
    getReviews: async (businessId) => {
        const { data } = await api.get(`/api/business/${businessId}/reviews`)
        return data
    },
    addReview: async (businessId, rating, comment) => {
        const { data } = await api.post(`/api/business/${businessId}/reviews`, { rating, comment })
        return data
    }
}

// Monetization Services
export const monetizationService = {
    getStats: async () => {
        const { data } = await api.get('/api/monetization/stats')
        return data?.data ?? data ?? {}
    },
    getProfile: async () => {
        const { data } = await api.get('/api/monetization/profile')
        return data?.data ?? data ?? null
    },
    getTiers: async () => {
        const { data } = await api.get('/api/monetization/tiers')
        return (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    },
    getTransactions: async (params = {}) => {
        const { data } = await api.get('/api/monetization/transactions', { params })
        return (Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    },
    apply: async () => {
        const { data } = await api.post('/api/monetization/apply')
        return data?.data ?? data
    },
    createTier: async (tierData) => {
        const { data } = await api.post('/api/monetization/tiers', tierData)
        return data?.data ?? data
    },
    updateTier: async (tierId, tierData) => {
        const { data } = await api.put(`/api/monetization/tiers/${tierId}`, tierData)
        return data?.data ?? data
    },
    updatePayoutMethod: async (method, details) => {
        const { data } = await api.put('/api/monetization/payout-method', { method, details })
        return data?.data ?? data
    },
    subscribe: async (creatorId, tierId) => {
        const { data } = await api.post('/api/monetization/subscribe', { creatorId, tierId })
        return data?.data ?? data
    }
}

// List Services
export const listService = {
    getPinned: async () => {
        const res = await api.get('/api/lists/pinned')
        const payload = res.data
        return Array.isArray(payload) ? payload : (payload?.data ?? [])
    },
    getDiscover: async () => {
        const { data } = await api.get('/api/lists/discover')
        return data
    },
    getYours: async () => {
        const res = await api.get('/api/lists/yours')
        const payload = res.data
        return Array.isArray(payload) ? payload : (payload?.data ?? [])
    },
    getList: async (listId) => {
        const { data } = await api.get(`/api/lists/${listId}`)
        return data?.data ?? data
    },
    getMembers: async (listId) => {
        const { data } = await api.get(`/api/lists/${listId}/members`)
        return Array.isArray(data) ? data : (data?.data ?? [])
    },
    getFollowers: async (listId) => {
        const { data } = await api.get(`/api/lists/${listId}/followers`)
        return Array.isArray(data) ? data : (data?.data ?? [])
    },

    getPosts: async (listId, params = {}) => {
        const { data } = await api.get(`/api/lists/${listId}/posts`, { params })
        return Array.isArray(data) ? data : (data?.data ?? [])
    },
    createList: async (listData) => {
        const { data } = await api.post('/api/lists', listData)
        return data?.data ?? data
    },
    updateList: async (listId, updates) => {
        const { data } = await api.patch(`/api/lists/${listId}`, updates)
        return data?.data ?? data
    },
    deleteList: async (listId) => {
        const { data } = await api.delete(`/api/lists/${listId}`)
        return data
    },
    addMember: async (listId, userId) => {
        const { data } = await api.post(`/api/lists/${listId}/members`, { userId })
        return data
    },
    removeMember: async (listId, userId) => {
        const { data } = await api.delete(`/api/lists/${listId}/members/${userId}`)
        return data
    },
    getMembershipStatus: async (userId) => {
        const { data } = await api.get(`/api/lists/membership/${userId}`)
        return data
    },
    togglePin: async (listId, pinned) => {
        const res = await api.patch(`/api/lists/${listId}/pin`, { pinned })
        const body = res.data
        return body?.data ?? body
    },
    followList: async (listId) => {
        const { data } = await api.post(`/api/lists/${listId}/follow`)
        return data
    },
    unfollowList: async (listId) => {
        const { data } = await api.delete(`/api/lists/${listId}/follow`)
        return data
    },
    getDiscoverPaginated: async (limit = 5, offset = 0) => {
        const { data } = await api.get('/api/lists/discover', { params: { limit, offset } })
        return data
    }
}

// Moderation Services
export const moderationService = {
    reportContent: async (contentType, contentId, reason) => {
        const { data } = await api.post('/api/moderation/report', { contentType, contentId, reason })
        return data
    }
}

// Settings Services
export const settingsService = {
    getSettings: async () => {
        const { data } = await api.get('/api/settings')
        return data
    },
    updateSettings: async (settings) => {
        const { data } = await api.put('/api/settings', settings)
        return data
    }
}

// Institutional Services
export const institutionalService = {
    getProfile: async () => {
        const { data } = await api.get('/api/institutional')
        return data
    },
    updateProfile: async (profileData) => {
        const { data } = await api.post('/api/institutional', profileData)
        return data
    },
    verifyDomain: async () => {
        const { data } = await api.post('/api/institutional/verify-domain')
        return data
    },
    reviewProfile: async (id, reviewData) => {
        const { data } = await api.patch(`/api/institutional/admin/review/${id}`, reviewData)
        return data
    }
}

// Announcement Services
export const announcementService = {
    createAnnouncement: async (data) => {
        const { data: response } = await api.post('/api/announcements/create', data)
        return response
    },
    updateAnnouncement: async (id, data) => {
        const { data: response } = await api.put(`/api/announcements/update/${id}`, data)
        return response
    },
    getFeed: async (params = {}) => {
        const { data: response } = await api.get('/api/announcements/feed', { params })
        return response
    },
    getAnnouncement: async (id) => {
        const { data: response } = await api.get(`/api/announcements/${id}`)
        return response
    },
    generateSummary: async (content) => {
        const { data: response } = await api.post('/api/announcements/generate-summary', { content })
        return response
    }
}

// Werfie AI - uses backend proxy /api/ai/chat (avoids CORS)
export const werfieAiService = {
    chat: async (text) => {
        const base = import.meta.env.VITE_API_URL || ''
        const url = base ? `${base.replace(/\/$/, '')}/api/ai/chat` : '/api/ai/chat'
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ text })
        })
        const json = await response.json().catch(() => ({}))
        if (!response.ok) {
            throw new Error(json?.message || `AI request failed: ${response.status}`)
        }
        return json?.data?.text ?? json?.text ?? 'No response from AI.'
    }
}

// Highlights Services
export const highlightsService = {
    toggleHighlight: async (postId) => {
        const { data } = await api.post('/api/highlights/toggle', { postId });
        return data;
    },
    getHighlights: async (userId) => {
        const { data } = await api.get(`/api/highlights/user/${userId}`);
        return (data?.data?.posts || data?.posts || data || []);
    }
};

// Articles Services
export const articlesService = {
    createArticle: async (articleData) => {
        const { data } = await api.post('/api/articles', articleData);
        return data?.data ?? data;
    },
    getArticles: async (userId, publishedOnly = false) => {
        const { data } = await api.get(`/api/articles/user/${userId}`, {
            params: { publishedOnly }
        });
        const items = data?.data ?? data;
        return Array.isArray(items) ? items : [];
    },
    getArticle: async (id) => {
        const { data } = await api.get(`/api/articles/${id}`);
        const payload = data?.data ?? data ?? null;
        return payload && typeof payload === 'object' && payload.id ? payload : null;
    },
    updateArticle: async (id, articleData) => {
        const { data } = await api.put(`/api/articles/${id}`, articleData);
        return data?.data ?? data;
    },
    deleteArticle: async (id) => {
        const { data } = await api.delete(`/api/articles/${id}`);
        return data;
    }
};
