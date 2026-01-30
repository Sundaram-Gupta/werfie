import api from '@/lib/axios';

export const spaceService = {
    getAllSpaces: async () => {
        const { data } = await api.get('/api/spaces'); // This now exists!
        return data;
    },

    cancelSpace: async (spaceId) => {
        // Assuming this endpoint might be needed or exists in similar form
        // For now, let's assume we can update status or delete
        const { data } = await api.put(`/api/spaces/${spaceId}/cancel`);
        return data;
    },

    deleteSpace: async (spaceId) => {
        const { data } = await api.delete(`/api/spaces/${spaceId}`);
        return data;
    }
};
