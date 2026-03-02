import api from '@/lib/axios';

export const getInstitutionalProfiles = async (status = '') => {
    try {
        const response = await api.get('/admin/institutional', {
            params: status ? { status } : {}
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching institutional profiles:', error);
        return [];
    }
};

export const reviewInstitutionalProfile = async (id, data) => {
    try {
        const response = await api.patch(`/admin/institutional/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Error reviewing institutional profile:', error);
        throw error;
    }
};
