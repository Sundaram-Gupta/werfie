import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/api'

import i18n from '@/i18n'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Check if user is logged in on mount
    useEffect(() => {
        const AUTH_CHECK_TIMEOUT_MS = 10000 // 10s - don't hang forever if backend unreachable

        const checkAuth = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userData = await Promise.race([
                        authService.getCurrentUser(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Auth check timeout')), AUTH_CHECK_TIMEOUT_MS)
                        ),
                    ])
                    setUser(userData)
                    if (userData?.preferredLanguage) {
                        i18n.changeLanguage(userData.preferredLanguage)
                    }
                } catch (error) {
                    console.error('Auth check failed:', error)
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
