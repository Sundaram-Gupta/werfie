import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedUser = authService.getCurrentUser();
                if (storedUser) {
                    setUser(storedUser);
                }
            } catch (error) {
                console.error('Auth init failed', error);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email, password, role) => {
        const user = await authService.login(email, password, role);
        setUser(user);
        return user;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    const updateUser = async (updates) => {
        const updatedUser = await authService.updateProfile(updates);
        setUser(updatedUser);
        return updatedUser;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
