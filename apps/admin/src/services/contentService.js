import api from '@/lib/axios';

/** Get total post count only (uncapped, for display e.g. 103.5K). Returns real total from DB. */
export const getPostsCount = async () => {
    try {
        const response = await api.get('/admin/posts/count');
        const data = response?.data;
        const raw = data?.totalPosts ?? data?.total ?? (typeof data === 'number' ? data : null);
        const n = raw != null ? Number(raw) : NaN;
        return Number.isFinite(n) ? n : 0;
    } catch (error) {
        console.error('Error fetching posts count:', error);
        return 0;
    }
};

export const getPosts = async (filter = 'all', page = 1, limit = 100) => {
    try {
        const response = await api.get('/admin/posts', {
            params: { filter, page, limit }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        return { posts: [], pagination: { totalPosts: 0, currentPage: 1, totalPages: 0, limit } };
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
