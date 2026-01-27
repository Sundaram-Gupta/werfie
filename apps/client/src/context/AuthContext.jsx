import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userData = await authService.getCurrentUser()
                    setUser(userData)
                } catch (error) {
                    console.error('Auth check failed:', error)
                    // Clear invalid tokens
                    authService.logout()
                }
            }
            setLoading(false)
        }

        checkAuth()
    }, [])

    const login = async (email, password) => {
        const data = await authService.login(email, password)
        setUser(data.user)
        return data
    }

    const register = async (email, password, name, handle) => {
        const data = await authService.register(email, password, name, handle)
        setUser(data.user)
        return data
    }

    const logout = async () => {
        await authService.logout()
        setUser(null)
    }

    const updateUser = (data) => {
        console.log('AuthContext: updateUser called with', data)
        setUser(prev => {
            if (!prev) return data
            const newState = {
                ...prev,
                ...data,
                profile: {
                    ...(prev.profile || {}),
                    ...(data.profile || {})
                }
            }
            console.log('AuthContext: New user state:', newState)
            return newState
        })
    }

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
