import api from '@/lib/axios';

function unpackLoginPayload(body) {
    if (!body || typeof body !== 'object') return null;
    if (body.user && body.token) return { user: body.user, token: body.token };
    if (body.data && body.data.user && body.data.token) return { user: body.data.user, token: body.data.token };
    return null;
}

export const login = async (email, password, role) => {
    try {
        console.log(`[AuthService] Attempting login for ${email} to ${api.defaults.baseURL}/admin/login`);
        const response = await api.post('/admin/login', { email, password });
        console.log('[AuthService] Response:', response.data);

        const unpacked = unpackLoginPayload(response.data);
        if (unpacked) {
            const { user, token } = unpacked;
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));
            return user;
        }
        throw new Error(response.data?.message || 'Login failed');
    } catch (error) {
        console.error('Login error:', error);
        const d = error.response?.data;
        const msg =
            (typeof d?.message === 'string' && d.message) ||
            (typeof d?.error === 'string' && d.error) ||
            error.message ||
            'Invalid credentials';
        throw new Error(msg);
    }
};

export const logout = async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
};

export const updateProfile = async (updates) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('No user logged in');

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    return updatedUser;
};
