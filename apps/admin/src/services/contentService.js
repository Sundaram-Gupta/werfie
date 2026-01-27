// Mock Content Service

const mockPosts = [
    { id: 1, user: 'Alice Smith', handle: '@alice', content: 'This is a test post that might be reported.', date: '2025-03-10', reportCount: 2, status: 'active', image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop' },
    { id: 2, user: 'Bob Jones', handle: '@bobj', content: 'Spam report test content.', date: '2025-03-09', reportCount: 5, status: 'hidden' },
    { id: 3, user: 'Charlie Day', handle: '@charlie', content: 'Just a normal day.', date: '2025-03-08', reportCount: 0, status: 'active' },
    { id: 4, user: 'Eve White', handle: '@evew', content: 'Inappropriate content warning.', date: '2025-03-07', reportCount: 12, status: 'flagged' },
];

const mockReports = [
    { id: 101, type: 'Spam', targetId: 2, targetType: 'post', reporter: '@user123', status: 'pending', date: '2025-03-11' },
    { id: 102, type: 'Harassment', targetId: 4, targetType: 'post', reporter: '@victim', status: 'pending', date: '2025-03-11' },
    { id: 103, type: 'Bot', targetId: 1, targetType: 'user', reporter: '@monitor', status: 'resolved', date: '2025-03-10' },
    { id: 104, type: 'Misinformation', targetId: 1, targetType: 'post', reporter: '@factcheck', status: 'escalated', date: '2025-03-09' },
];

export const getPosts = async (filter = 'all') => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPosts.filter(p => filter === 'reported' ? p.reportCount > 0 : true);
};

export const deletePost = async (postId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
};

export const hidePost = async (postId) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
};

export const getReports = async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockReports;
};

export const updateReportStatus = async (reportId, status) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true };
};
