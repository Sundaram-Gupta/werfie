import api from '@/lib/api';

const API_URL = '/api/soapbox';

export const soapboxApi = {
    /**
     * List all soapbox sessions.
     */
    listSessions: async (params = {}) => {
        const response = await api.get(`${API_URL}/list`, { params });
        return response.data;
    },

    /**
     * Get details of a specific session.
     */
    getSession: async (id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    /**
     * Create a new session.
     */
    createSession: async (data) => {
        const response = await api.post(`${API_URL}/create`, data);
        return response.data;
    },

    /**
     * Start a session manually.
     */
    startSession: async (id) => {
        const response = await api.post(`${API_URL}/${id}/start`);
        return response.data;
    },

    /**
     * End a session manually.
     */
    endSession: async (id) => {
        const response = await api.post(`${API_URL}/${id}/end`);
        return response.data;
    },

    /**
     * Add a statement to a live session.
     */
    addStatement: async (id, data) => {
        const response = await api.post(`${API_URL}/${id}/statement`, data);
        return response.data;
    },

    /**
     * Submit a rebuttal.
     */
    submitRebuttal: async (id, data) => {
        const response = await api.post(`${API_URL}/${id}/rebuttal`, data);
        return response.data;
    },

    /**
     * Get transcript and summary.
     */
    getTranscript: async (id) => {
        const response = await api.get(`${API_URL}/${id}/transcript`);
        return response.data;
    }
};
