import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3012') + '/api', // Correctly point to /api endpoint
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
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            // Handle unauthorized access (e.g., redirect to login)
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
