import api from '@/lib/axios';

export const configService = {
    // API Keys
    getApiKeys: async () => {
        const response = await api.get('/api/admin/config/api-keys');
        return response.data;
    },
    createApiKey: async (data) => {
        const response = await api.post('/api/admin/config/api-keys', data);
        return response.data;
    },
    updateApiKey: async (id, data) => {
        const response = await api.patch(`/api/admin/config/api-keys/${id}`, data);
        return response.data;
    },
    revokeApiKey: async (id) => {
        const response = await api.delete(`/api/admin/config/api-keys/${id}`);
        return response.data;
    },
    rotateApiKey: async (id) => {
        const response = await api.patch(`/api/admin/config/api-keys/${id}`, { rotate: true });
        return response.data;
    },

    // Push Config
    getPushConfigs: async () => {
        const response = await api.get('/api/admin/config/push');
        return response.data;
    },
    updatePushConfig: async (data) => {
        const response = await api.patch('/api/admin/config/push', data);
        return response.data;
    },

    // Broadcasts
    getBroadcasts: async () => {
        const response = await api.get('/api/admin/notifications/broadcast');
        return response.data;
    },
    sendBroadcast: async (data) => {
        const response = await api.post('/api/admin/notifications/broadcast', data);
        return response.data;
    }
};
