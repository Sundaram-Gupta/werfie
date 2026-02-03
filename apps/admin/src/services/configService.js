import api from '@/lib/axios';

export const configService = {
    // API Keys
    getApiKeys: async () => {
        const response = await api.get('/admin/config/api-keys');
        return response.data;
    },
    createApiKey: async (data) => {
        const response = await api.post('/admin/config/api-keys', data);
        return response.data;
    },
    updateApiKey: async (id, data) => {
        const response = await api.patch(`/admin/config/api-keys/${id}`, data);
        return response.data;
    },
    revokeApiKey: async (id) => {
        const response = await api.delete(`/admin/config/api-keys/${id}`);
        return response.data;
    },
    rotateApiKey: async (id) => {
        const response = await api.patch(`/admin/config/api-keys/${id}`, { rotate: true });
        return response.data;
    },

    // Push Config
    getPushConfigs: async () => {
        const response = await api.get('/admin/config/push');
        return response.data;
    },
    updatePushConfig: async (data) => {
        const response = await api.patch('/admin/config/push', data);
        return response.data;
    },

    // Broadcasts
    getBroadcasts: async () => {
        const response = await api.get('/admin/notifications/broadcast');
        return response.data;
    },
    sendBroadcast: async (data) => {
        const response = await api.post('/admin/notifications/broadcast', data);
        return response.data;
    }
};
