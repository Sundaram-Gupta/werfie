import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { validateRegisterForm } from '@/lib/validation'

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        handle: ''
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState('')

    const { register } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setServerError('')

        // Client-side validation
        const validation = validateRegisterForm(
            formData.email,
            formData.password,
            formData.name,
            formData.handle
        )

        if (!validation.isValid) {
            setErrors(validation.errors)
            return
        }

        setErrors({})
        setLoading(true)

        try {
            await register(
                formData.email,
                formData.password,
                formData.name,
                formData.handle
            )
            navigate('/')
        } catch (error) {
            console.error('Registration failed:', error)
            const isTimeout = error.code === 'ECONNABORTED' || (error.message || '').toLowerCase().includes('timeout')
            const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')
            const data = error.response?.data
            const msg = data?.message ?? data?.error ?? error.message
            let errorMsg = msg
            if (isTimeout) {
                errorMsg = 'Request timed out. The server may be slow or unreachable. Please check your connection and try again.'
            } else if (isNetworkError) {
                errorMsg = 'Cannot reach server. On the machine running the app: run "pm2 list" and ensure auth-service and client are online. From another device: allow port 5173 in Windows Firewall.'
            } else if (error.response?.status === 503) {
                errorMsg = 'Backend unreachable. On the dev machine run: pm2 delete auth-service then pm2 start ecosystem.config.js --only auth-service'
            } else if (!msg) {
                errorMsg = 'Registration failed. Please try again.'
            }
            setServerError(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <img
                        src="/websplash.png"
                        alt="Werfie Logo"
                        className="w-12 h-12 dark:invert"
                    />
                </div>

                <h1 className="text-3xl font-bold mb-8 text-center">Join Werfie today</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-border'
                                } bg-background focus:outline-none focus:ring-2 focus:ring-primary`}
                            placeholder="Enter your name"
                            disabled={loading}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Handle Field */}
                    <div>
                        <label htmlFor="handle" className="block text-sm font-medium mb-2">
                            Handle (username)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-muted-foreground">@</span>
                            <input
                                id="handle"
                                name="handle"
                                type="text"
                                value={formData.handle}
                                onChange={handleChange}
                                className={`w-full pl-8 pr-4 py-3 rounded-lg border ${errors.handle ? 'border-red-500' : 'border-border'
                                    } bg-background focus:outline-none focus:ring-2 focus:ring-primary`}
                                placeholder="yourhandle"
                                disabled={loading}
                            />
                        </div>
                        {errors.handle && (
                            <p className="text-red-500 text-sm mt-1">{errors.handle}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Min 3 characters, letters, numbers, and underscores only
                        </p>
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-border'
                                } bg-background focus:outline-none focus:ring-2 focus:ring-primary`}
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-border'
                                } bg-background focus:outline-none focus:ring-2 focus:ring-primary`}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimum 8 characters
                        </p>
                    </div>

                    {/* Server Error */}
                    {serverError && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-500 text-sm">{serverError}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center mt-6 text-muted-foreground">
                    Already have an account?{' '}
                    <a href="/login" className="text-primary hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
}
