import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { validateLoginForm } from '@/lib/validation'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState('')

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setServerError('')

        // Client-side validation
        const validation = validateLoginForm(email, password)
        if (!validation.isValid) {
            setErrors(validation.errors)
            return
        }

        setErrors({})
        setLoading(true)

        try {
            await login(email, password)
            navigate('/')
        } catch (error) {
            console.error('Login failed:', error)
            const isTimeout = error.code === 'ECONNABORTED' || (error.message || '').includes('timeout')
            const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')
            const data = error.response?.data
            const msg = data?.message ?? data?.error ?? error.message
            let displayMsg = msg
            if (isTimeout) {
                displayMsg = 'Request timed out. The backend may be slow or PostgreSQL may not be running. Check: pm2 logs auth-service'
            } else if (isNetworkError) {
                displayMsg = 'Cannot reach server. On the machine running the app: run "pm2 list" and ensure auth-service and client are online. If using another device, allow port 5173 in Windows Firewall.'
            } else if (!msg) {
                displayMsg = 'Login failed. Please try again.'
            }
            setServerError(displayMsg)
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

                <h1 className="text-3xl font-bold mb-8 text-center">Sign in to Werfie</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-border'
                                } bg-background focus:outline-none focus:ring-2 focus:ring-primary`}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
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
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                {/* Register Link */}
                <p className="text-center mt-6 text-muted-foreground">
                    Don't have an account?{' '}
                    <a href="/signup" className="text-primary hover:underline">
                        Sign up
                    </a>
                </p>


            </div>
        </div>
    )
}
