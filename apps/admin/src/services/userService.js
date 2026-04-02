import api from '@/lib/axios';

export const getUsers = async (page = 1, limit = 10, search = '') => {
    try {
        // Use the admin users endpoint
        const response = await api.get('/admin/users', {
            params: { page, limit, search }
        });
        return response.data; // This now includes pagination metadata
    } catch (error) {
        console.error('Error fetching users:', error);
        return { users: [], pagination: { totalPages: 0, totalUsers: 0 } };
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

export const updateUserVerification = async (userId, isVerified) => {
    try {
        const response = await api.patch(`/admin/users/${userId}/verification`, { isVerified });
        return response.data;
    } catch (error) {
        console.error('Error updating user verification:', error);
        throw error;
    }
};
