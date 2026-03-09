import api from '@/lib/axios';

export const login = async (email, password, role) => {
    try {
        console.log(`[AuthService] Attempting login for ${email} to ${api.defaults.baseURL}/admin/login`);
        const response = await api.post('/admin/login', { email, password });
        console.log('[AuthService] Response:', response.data);

        const payload = response.data;
        if (payload?.user && payload?.token) {
            const { user, token } = payload;
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));
            return user;
        } else {
            throw new Error(response.data?.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Invalid credentials');
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
