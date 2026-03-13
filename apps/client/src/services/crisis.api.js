import api from '@/lib/api';

export const createCrisis = async (data) => {
    const response = await api.post('/api/crisis/create', data);
    return response.data;
};

export const updateCrisis = async (id, data) => {
    const response = await api.put(`/api/crisis/update/${id}`, data);
    return response.data;
};

export const getCrises = async (filters = {}) => {
    const response = await api.get('/api/crisis/list', { params: filters });
    return response.data;
};

export const getCrisisDetail = async (id) => {
    const response = await api.get(`/api/crisis/${id}`);
    return response.data;
};

export const addCrisisUpdate = async (data) => {
    const response = await api.post('/api/crisis/update-event', data);
    return response.data;
};

export const addCrisisStream = async (data) => {
    const response = await api.post('/api/crisis/stream/add', data);
    return response.data;
};

export const deleteCrisis = async (id) => {
    const response = await api.delete(`/api/crisis/${id}`);
    return response.data;
};
