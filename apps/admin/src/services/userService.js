export const getUsers = async (page = 1, limit = 10, search = '') => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const allUsers = [
        { id: 1, name: 'Alice Smith', handle: '@alice', email: 'alice@example.com', status: 'verified', joined: '2025-01-10', posts: 120 },
        { id: 2, name: 'Bob Jones', handle: '@bobj', email: 'bob@example.com', status: 'active', joined: '2025-02-15', posts: 45 },
        { id: 3, name: 'Charlie Day', handle: '@charlie', email: 'charlie@example.com', status: 'banned', joined: '2024-11-20', posts: 12 },
        { id: 4, name: 'David Lee', handle: '@davidl', email: 'david@example.com', status: 'active', joined: '2025-03-05', posts: 89 },
        { id: 5, name: 'Eve White', handle: '@evew', email: 'eve@example.com', status: 'active', joined: '2025-01-22', posts: 230 },
        { id: 6, name: 'Frank Miller', handle: '@frankm', email: 'frank@example.com', status: 'suspended', joined: '2024-12-10', posts: 5 },
        { id: 7, name: 'Grace Liu', handle: '@gracel', email: 'grace@example.com', status: 'verified', joined: '2025-02-28', posts: 567 },
    ];

    let filtered = allUsers;
    if (search) {
        const q = search.toLowerCase();
        filtered = allUsers.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.handle.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }

    return {
        users: filtered,
        total: filtered.length
    };
};

export const updateUserStatus = async (userId, status) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: true };
};
