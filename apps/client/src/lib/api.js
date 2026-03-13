import axios from 'axios'

// API Base URL - Backend server
// API Base URL - Backend server
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - Add auth token (trim to avoid control-char / JSON parse errors)
api.interceptors.request.use(
    (config) => {
        const raw = localStorage.getItem('accessToken')
        const token = raw ? raw.trim().replace(/\s+/g, ' ') : null
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Normalize APIs that return { status, message, data } - extract the actual payload
function normalizeResponse(response) {
    const d = response?.data
    if (d && typeof d === 'object' && 'status' in d && 'data' in d) {
        response.data = d.data
    }
    return response
}

// Response interceptor - Normalize format + handle token refresh
api.interceptors.response.use(
    (response) => normalizeResponse(response),
    async (error) => {
        const originalRequest = error.config

        // If 401 or 403 (sometimes used for expired) and we haven't tried to refresh yet
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refreshToken')
                if (refreshToken) {
                    const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                        refreshToken,
                    })
                    const payload = data?.data ?? data
                    localStorage.setItem('accessToken', payload.accessToken)
                    originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`

                    return api(originalRequest)
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api
