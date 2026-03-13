import api from '@/lib/api';

// Using the central api instance which handles accessToken via localStorage automatically
// and routes through the Gateway (3001)

export const createComment = async (announcementId, content, parentCommentId = null) => {
    const response = await api.post('/api/comments/create', { announcementId, content, parentCommentId });
    return response.data;
};

export const getComments = async (announcementId) => {
    const response = await api.get(`/api/comments/${announcementId}`);
    return response.data;
};

export const reportComment = async (commentId, reason) => {
    const response = await api.post('/api/comments/report', { commentId, reason });
    return response.data;
};

// --- MODERATION ---
export const getModerationQueue = async (status = 'pending') => {
    const response = await api.get(`/api/comments/moderation/queue?status=${status}`);
    return response.data;
};

export const approveComment = async (queueId, notes = "") => {
    const response = await api.post(`/api/comments/moderation/approve/${queueId}`, { notes });
    return response.data;
};

export const rejectComment = async (queueId, notes = "") => {
    const response = await api.post(`/api/comments/moderation/reject/${queueId}`, { notes });
    return response.data;
};

export const flagFact = async (commentId, flag) => {
    const response = await api.post(`/api/comments/moderation/fact-flag/${commentId}`, { flag });
    return response.data;
};
