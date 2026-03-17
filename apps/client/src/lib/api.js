import axios from 'axios'

// Use same-origin when on LAN IP (e.g. 192.168.1.101:5173) to avoid CORS - Vite proxies /api -> gateway.
// If VITE_API_URL is set and we're on localhost, use it. Otherwise use same-origin.
export const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isLanOrRemote = host.startsWith('192.168.') || host.startsWith('10.') || (host.startsWith('172.') && /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host))
    if (isLanOrRemote) return window.location.origin
    if (!import.meta.env.VITE_API_URL) return window.location.origin
  }
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return ''
}

// For direct service URLs (e.g. WebSockets) when on LAN - use host + service port
export const getContentServiceUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host.startsWith('192.168.') || host.startsWith('10.') || (host.startsWith('172.') && /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host))) {
      return `${window.location.protocol}//${host}:3003`
    }
  }
  return import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:3003'
}

export const API_BASE_URL = getApiBase()

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30s - prevents infinite buffering if backend is slow/unreachable
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
        // skip for login route to avoid redundant refresh attempts on bad credentials
        const isLoginRequest = originalRequest.url.includes('/api/auth/login')
        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry && !isLoginRequest) {
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
