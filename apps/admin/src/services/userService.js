import api from '@/lib/axios';

export const getUsers = async (page = 1, limit = 10, search = '') => {
    try {
        // Use the public search endpoint which we know exists
        const response = await api.get('/api/search/users', {
            params: { q: search, limit, offset: (page - 1) * limit }
        });
        return { users: response.data || [] }; // Map array to expected object structure if needed
    } catch (error) {
        console.error('Error fetching users:', error);
        return { users: [] };
    }
};

export const updateUserStatus = async (userId, status) => {
    try {
        const response = await api.patch(`/admin/users/${userId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    }
};

export const updateUserRole = async (userId, role) => {
    try {
        const response = await api.patch(`/admin/users/${userId}/role`, { role });
        return response.data;
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};
