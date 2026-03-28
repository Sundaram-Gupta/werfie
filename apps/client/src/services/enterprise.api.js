import api from '@/lib/api';

export const getDashboardMetrics = async () => {
    try {
        const { data } = await api.get('/api/enterprise/metrics/overview');
        return data?.data;
    } catch (error) {
        console.error("Error fetching enterprise metrics:", error);
        throw error;
    }
};

export const getMarketSignals = async () => {
    try {
        const { data } = await api.get('/api/enterprise/signals');
        return data?.data || [];
    } catch (error) {
        console.error("Error fetching market signals:", error);
        throw error;
    }
};

export const createAlertRule = async (ruleData) => {
    try {
        const { data } = await api.post('/api/enterprise/alerts/create', ruleData);
        return data;
    } catch (error) {
        console.error("Error creating alert rule:", error);
        throw error;
    }
};

export const getAlertRules = async () => {
    try {
        const { data } = await api.get('/api/enterprise/alerts/list');
        return data?.data || [];
    } catch (error) {
        console.error("Error fetching alert rules:", error);
        throw error;
    }
};

export const deleteAlertRule = async (id) => {
    try {
        const { data } = await api.delete(`/api/enterprise/alerts/delete/${id}`);
        return data;
    } catch (error) {
        console.error("Error deleting alert rule:", error);
        throw error;
    }
};

const getApiBase = () => import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const exportToCSV = () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const url = `${getApiBase()}/api/enterprise/export/csv`;
    window.open(token ? `${url}?token=${encodeURIComponent(token)}` : url, '_blank');
};

export const exportToJSON = () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const url = `${getApiBase()}/api/enterprise/export/json`;
    window.open(token ? `${url}?token=${encodeURIComponent(token)}` : url, '_blank');
};
