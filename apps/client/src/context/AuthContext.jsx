import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services/api'

import i18n from '@/i18n'

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
                    if (userData) {
                        setUser(userData)
                        if (userData.preferredLanguage) {
                            i18n.changeLanguage(userData.preferredLanguage)
                        }
                    } else {
                        await authService.logout()
                    }
                } catch (error) {
                    console.error('Auth check failed:', error)
                    await authService.logout()
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
        setUser(prev => {
            if (!prev) return data
            return {
                ...prev,
                ...data,
                profile: {
                    ...(prev.profile || {}),
                    ...(data.profile || {})
                }
            }
        })
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
