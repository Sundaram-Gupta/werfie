import api from '@/lib/axios';

export const getPosts = async (page = 1, limit = 10, filter = 'all') => {
    try {
        const response = await api.get('/admin/posts', {
            params: { page, limit, filter }
        });
        return response.data; // This now includes pagination metadata
    } catch (error) {
        console.error('Error fetching posts:', error);
        return { posts: [], pagination: { totalPages: 0, totalPosts: 0 } };
    }
};

export const deletePost = async (postId) => {
    try {
        const response = await api.delete('/admin/posts', {
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
        const response = await api.patch(`/admin/posts/${postId}/status`, { status: 'hidden' });
        return response.data;
    } catch (error) {
        console.error('Error hiding post:', error);
        return { success: false };
    }
};

export const getReports = async () => {
    try {
        const response = await api.get('/admin/reports');
        return response.data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        return [];
    }
};

export const updateReportStatus = async (reportId, status) => {
    try {
        const response = await api.patch(`/admin/reports/${reportId}`, { status });
        return response.data;
    } catch (error) {
        console.error('Error updating report status:', error);
        return { success: false };
    }
};

export const getMedia = async () => {
    try {
        const response = await api.get('/admin/media');
        return response.data;
    } catch (error) {
        console.error('Error fetching media:', error);
        return { items: [] };
    }
};

export const deleteMedia = async (id) => {
    try {
        const response = await api.delete(`/admin/media/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting media:', error);
        throw error;
    }
};

export const getFlaggedMessages = async () => {
    try {
        const response = await api.get('/admin/messaging');
        return response.data;
    } catch (error) {
        console.error('Error fetching flagged messages:', error);
        return { items: [] };
    }
};

export const deleteMessage = async (id) => {
    try {
        const response = await api.delete(`/admin/messaging/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

export const approveMessage = async (id) => {
    try {
        const response = await api.patch(`/admin/messaging/${id}`, { status: 'approved' });
        return response.data;
    } catch (error) {
        console.error('Error approving message:', error);
        throw error;
    }
};
