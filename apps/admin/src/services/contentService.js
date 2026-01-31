import api from '@/lib/axios';

export const getPosts = async (filter = 'all') => {
    try {
        const response = await api.get('/api/admin/posts', {
            params: { filter }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

export const deletePost = async (postId) => {
    try {
        const response = await api.delete('/api/admin/posts', {
            params: { id: postId }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

export const hidePost = async (postId) => {
    try {
        // Assuming we might want a patch route for status later
        const response = await api.patch(`/api/admin/posts/${postId}/status`, { status: 'hidden' });
        return response.data;
    } catch (error) {
        console.error('Error hiding post:', error);
        return { success: false };
    }
};

export const getReports = async () => {
    try {
        const response = await api.get('/api/admin/reports');
        return response.data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        return [];
    }
};

export const updateReportStatus = async (reportId, status) => {
    try {
        const response = await api.patch(`/api/admin/reports/${reportId}`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating report status:', error);
        return { success: false };
    }
};
