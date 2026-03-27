import api from '@/lib/api';

export const getAdminDashboard = async () => {
    const res = await api.get('/api/crisis/admin/dashboard');
    return res.data;
};

export const getAdminCrises = async (params = {}) => {
    const res = await api.get('/api/crisis/admin/list', { params });
    return res.data;
};

export const resolveCrisis = async (id) => {
    const res = await api.post(`/api/crisis/admin/${id}/resolve`);
    return res.data;
};

export const increaseCrisisSeverity = async (id) => {
    const res = await api.post(`/api/crisis/admin/${id}/increase-severity`);
    return res.data;
};

export const attachAnnouncements = async (id, announcementIds) => {
    const res = await api.put(`/api/crisis/admin/${id}/announcements`, { announcementIds });
    return res.data;
};

export const toggleCrisisStreamLive = async (streamId, isLive) => {
    const res = await api.patch(`/api/crisis/admin/streams/${streamId}/live`, { isLive });
    return res.data;
};

export const getAnnouncementsFeed = async (params = {}) => {
    const res = await api.get('/api/announcements/feed', { params });
    return res.data;
};

export const getAdminUsers = async (params = {}) => {
    const res = await api.get('/api/crisis/admin/users', { params });
    return res.data;
};

export const updateUserRole = async (id, role) => {
    const res = await api.put(`/api/crisis/admin/users/${id}/role`, { role });
    return res.data;
};

export const disableUser = async (id, disabled = true) => {
    const res = await api.put(`/api/crisis/admin/users/${id}/disable`, { disabled });
    return res.data;
};

export const getAuditLogs = async (params = {}) => {
    const res = await api.get('/api/crisis/admin/logs', { params });
    return res.data;
};
