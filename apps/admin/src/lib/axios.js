import axios from 'axios';

// Use relative /api in dev (Vite proxies to admin-backend); full URL when VITE_API_URL is set
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log(`[Axios] API Base URL: ${api.defaults.baseURL}`);

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken'); // Validating admin token
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Normalize API responses: { status, message, data } -> extract data
function normalizeResponse(response) {
    const d = response?.data;
    if (d && typeof d === 'object' && 'status' in d && 'data' in d) {
        response.data = d.data;
    }
    return response;
}

// Add a response interceptor
api.interceptors.response.use(
    (response) => normalizeResponse(response),
    (error) => {
        const reqUrl = String(error.config?.url || '');
        const isLoginAttempt = reqUrl.includes('admin/login');
        // Failed login returns 401 — do not clear session or hard-redirect (user is already on /login).
        if (error.response && error.response.status === 401 && !isLoginAttempt) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
