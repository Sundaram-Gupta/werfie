import axios from 'axios';

// Assuming standard env mapping for content service where enterprise logic was built
const ENTERPRISE_SERVICE_URL = import.meta.env.VITE_CONTENT_SERVICE_URL || 'http://localhost:3003';

export const getDashboardMetrics = async () => {
    try {
        const response = await axios.get(`${ENTERPRISE_SERVICE_URL}/api/enterprise/metrics/overview`);
        return response.data;
    } catch (error) {
        console.error("Error fetching enterprise metrics:", error);
        throw error;
    }
};

export const getMarketSignals = async () => {
    try {
        const response = await axios.get(`${ENTERPRISE_SERVICE_URL}/api/enterprise/signals`);
        return response.data.signals || [];
    } catch (error) {
        console.error("Error fetching market signals:", error);
        throw error;
    }
};

export const createAlertRule = async (ruleData) => {
    try {
        // Need to pass userId in real scenario. 
        // Mocking for now from local storage or simply letting backend handle if unrestricted in demo
        const userId = 'demo-user-123';
        const response = await axios.post(`${ENTERPRISE_SERVICE_URL}/api/enterprise/alerts/create`, { ...ruleData, userId });
        return response.data;
    } catch (error) {
        console.error("Error creating alert rule:", error);
        throw error;
    }
};

export const getAlertRules = async (userId = 'demo-user-123') => {
    try {
        const response = await axios.get(`${ENTERPRISE_SERVICE_URL}/api/enterprise/alerts/list?userId=${userId}`);
        return response.data.rules || [];
    } catch (error) {
        console.error("Error fetching alert rules:", error);
        throw error;
    }
};

export const exportToCSV = () => {
    window.open(`${ENTERPRISE_SERVICE_URL}/api/enterprise/export/csv`, '_blank');
};

export const exportToJSON = () => {
    window.open(`${ENTERPRISE_SERVICE_URL}/api/enterprise/export/json`, '_blank');
};
