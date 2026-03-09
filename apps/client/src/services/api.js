import api from '@/lib/api'
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
        })

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
        })

        const payload = data?.data ?? data
        console.log('[Frontend Login] Successfully logged in. Institutional ID:', payload.institutionalProfile?.id || 'None');

        const user = {
            id: payload.id,
            email: payload.email,
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

    getFeed: async () => {
        // Use the posts-prefixed path to ensure we hit the content service via gateway proxy
        const { data } = await api.get('/api/posts/timeline/home')
        return data
    },
    changePassword: async (currentPassword, newPassword) => {
        const { data } = await api.post('/api/auth/change-password', { currentPassword, newPassword })
        return data
    },

    // Get current user
    getCurrentUser: async () => {
        const { data } = await api.get('/api/auth/me')
        return data
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

// Messaging API Instance
const MESSAGING_API_URL = import.meta.env.VITE_MESSAGING_URL || 'http://localhost:3019'

const messagingApi = axios.create({
    baseURL: MESSAGING_API_URL,
    headers: { 'Content-Type': 'application/json' }
})

// Add auth token to messaging requests
messagingApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Normalize messaging API { status, message, data } responses
messagingApi.interceptors.response.use(
    (response) => {
        const d = response?.data
        if (d && typeof d === 'object' && 'status' in d && 'data' in d) {
            response.data = d.data
        }
        return response
    },
    (error) => Promise.reject(error)
)

// Post Services
export const postService = {
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

    // Create post (with optional media and optional replyToId for replies)
    createPost: async (content, files = [], replyToId = null) => {
        const formData = new FormData();
        formData.append('content', content);
        if (replyToId) {
            formData.append('replyToId', replyToId);
        }

        // Append media files
        (files || []).forEach((file) => {
            formData.append('media', file);
        });

        const { data } = await api.post('/api/posts', formData);
        return data;
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

    // Get post replies
    getReplies: async (postId, params = {}) => {
        const { data } = await api.get(`/api/posts/${postId}/replies`, { params })
        return data
    },

    // Get following feed
    getFollowingPosts: async () => {
        const { data } = await api.get('/api/posts/following')
        return data
    },
}

// User Services
export const userService = {
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

    // Get suggestions
    getSuggestions: async (limit = 3) => {
        const { data } = await api.get('/api/users/suggestions', { params: { limit } })
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
        const { data } = await api.get('/api/users/search', {
            params: { q: query, ...params },
        })
        return data
    },


    // Get Trends
    getTrends: async () => {
        const { data } = await api.get('/api/trends', { params: { limit: 20 } })
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

    // Get Spaces
    getSpaces: async () => {
        const { data } = await api.get('/api/spaces')
        return data
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
    }
}

// Media Services
export const mediaService = {
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
        return data
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
        return data
    },
    updateProfile: async (profileData) => {
        const { data } = await api.post('/api/business', profileData)
        return data
    },
    getTeamMembers: async () => {
        const { data } = await api.get('/api/business/team')
        return data
    },
    addTeamMember: async (memberId, role) => {
        const { data } = await api.post('/api/business/team', { memberId, role })
        return data
    },
    removeTeamMember: async (memberId) => {
        const { data } = await api.delete(`/api/business/team/${memberId}`)
        return data
    }
}

// Monetization Services
export const monetizationService = {
    getRevenueStats: async () => {
        // Mock API call
        return { totalRev: 4280.00, subscribers: 142 }
    },
    getSubscribers: async () => {
        // Mock API call
        return []
    },
    updateTier: async (tierId, data) => {
        // Mock API call
        return { success: true }
    },
    getPayouts: async () => {
        // Mock API call
        return []
    }
}

// List Services
export const listService = {
    getPinned: async () => {
        const { data } = await api.get('/api/lists/pinned')
        return data
    },
    getDiscover: async () => {
        const { data } = await api.get('/api/lists/discover')
        return data
    },
    getYours: async () => {
        const { data } = await api.get('/api/lists/yours')
        return data
    },
    createList: async (listData) => {
        const { data } = await api.post('/api/lists', listData)
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
