import api from '@/lib/axios';

export const getDashboardStats = async () => {
    try {
        const response = await api.get('/api/admin/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};
