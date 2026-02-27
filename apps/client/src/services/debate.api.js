import api from '@/lib/api';

/**
 * Debate API Service
 * Handles communication with the backend debate endpoints.
 */
export const debateApi = {
    // ----------------------------------------------------------------------
    // Session Management
    // ----------------------------------------------------------------------

    /**
     * Create a new debate session
     * @param {Object} data - Debate session details (title, topic, participants, etc.)
     */
    createSession: async (data) => {
        const response = await api.post('/api/debate/create', data);
        return response.data;
    },

    /**
     * List all debate sessions (with optional filters)
     * @param {Object} filters - Query parameters for filtering (e.g., status: 'live')
     */
    listSessions: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/api/debate/list?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a specific debate session by ID
     * @param {string} id - The debate session ID
     */
    getSession: async (id) => {
        const response = await api.get(`/api/debate/${id}`);
        return response.data;
    },

    /**
     * Update a session's status (e.g., to archive it)
     * @param {string} id - The debate session ID
     * @param {string} status - The new status
     */
    updateSessionStatus: async (id, status) => {
        const response = await api.put(`/api/debate/update/${id}`, { status });
        return response.data;
    },

    // ----------------------------------------------------------------------
    // Round Management
    // ----------------------------------------------------------------------

    /**
     * Start a new round in a debate session
     * @param {string} sessionId - The debate session ID
     * @param {number} roundNumber - The sequence number of the round
     * @param {string} speakerId - The ID of the participant allowed to speak
     */
    startRound: async (sessionId, roundNumber, speakerId) => {
        const response = await api.post(`/api/debate/${sessionId}/start-round`, {
            roundNumber,
            speakerId
        });
        return response.data;
    },

    /**
     * End a specific round explicitly
     * @param {string} roundId - The ID of the current round
     */
    endRound: async (roundId) => {
        const response = await api.post(`/api/debate/round/${roundId}/end`);
        return response.data;
    },

    /**
     * Fetch all rounds for a debate session
     * @param {string} sessionId - The debate session ID
     */
    getRounds: async (sessionId) => {
        const response = await api.get(`/api/debate/${sessionId}/rounds`);
        return response.data;
    },

    // ----------------------------------------------------------------------
    // Argument & Fact-Checking
    // ----------------------------------------------------------------------

    /**
     * Post an argument in an active round
     * @param {string} roundId - The current active round ID
     * @param {string} argumentText - The content of the argument
     */
    postArgument: async (roundId, argumentText) => {
        const response = await api.post(`/api/debate/round/${roundId}/argument`, {
            argumentText
        });
        return response.data;
    },

    /**
     * Attach a fact-check reference to a posted argument
     * @param {Object} data - The fact-check data (argumentId, referenceTitle, URL, etc.)
     */
    attachFactCheck: async (data) => {
        const response = await api.post('/api/debate/fact-check', data);
        return response.data;
    },

    // ----------------------------------------------------------------------
    // Voting & Results
    // ----------------------------------------------------------------------

    /**
     * Cast a vote after a debate has concluded
     * @param {string} sessionId - The debate session ID
     * @param {string} voteChoice - 'participant_a', 'participant_b', or 'inconclusive'
     */
    submitVote: async (sessionId, voteChoice) => {
        const response = await api.post(`/api/debate/${sessionId}/vote`, {
            voteChoice
        });
        return response.data;
    },

    /**
     * Fetch the final voting results for a session
     * @param {string} sessionId - The debate session ID
     */
    getResults: async (sessionId) => {
        const response = await api.get(`/api/debate/${sessionId}/results`);
        return response.data;
    }
};
