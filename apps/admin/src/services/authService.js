// Mock Auth Service

export const login = async (email, password, role) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === 'admin@example.com' && password === 'admin') {
        const user = {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: role || 'admin',
            avatar: 'https://github.com/shadcn.png'
        };

        // Persist mock token
        localStorage.setItem('adminToken', 'mock-jwt-token');
        localStorage.setItem('adminUser', JSON.stringify(user));

        return user;
    }

    throw new Error('Invalid credentials');
};

export const logout = async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
};

export const getCurrentUser = () => {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
};

export const updateProfile = async (updates) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('No user logged in');

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    return updatedUser;
};
