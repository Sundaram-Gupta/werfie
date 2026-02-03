import api from '@/lib/axios';

export const login = async (email, password, role) => {
    try {
        const response = await api.post('/admin/login', { email, password });

        if (response.data.success) {
            const { user, token } = response.data;
            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));
            return user;
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.error || 'Invalid credentials');
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
