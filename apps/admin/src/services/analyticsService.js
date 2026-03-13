export const getDashboardStats = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
        totalUsers: 15420,
        dailyPosts: 2350,
        reports: 45,
        revenue: 12500,
        usersGrowth: +12,
        postsGrowth: +5,
        reportsGrowth: -2,
        revenueGrowth: +15
    };
};

export const getUserGrowthData = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { name: 'Jan', total: 4000 },
        { name: 'Feb', total: 5500 },
        { name: 'Mar', total: 7000 },
        { name: 'Apr', total: 9200 },
        { name: 'May', total: 11000 },
        { name: 'Jun', total: 13500 },
        { name: 'Jul', total: 15420 },
    ];
};

export const getRecentActivity = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        { id: 1, user: 'John Doe', action: 'Created a post', time: '2 mins ago' },
        { id: 2, user: 'Jane Smith', action: 'Reported a comment', time: '15 mins ago' },
        { id: 3, user: 'Bob Johnson', action: 'Signed up', time: '1 hour ago' },
        { id: 4, user: 'Alice Williams', action: 'Updated profile', time: '3 hours ago' },
        { id: 5, user: 'Charlie Brown', action: 'Deleted a post', time: '5 hours ago' },
    ];
};
