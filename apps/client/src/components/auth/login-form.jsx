import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthModal } from "./auth-modal-context"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext"

export function LoginForm() {
    const { openSignup } = useAuthModal()
    const navigate = useNavigate()
    const { login } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await login(email, password)
            console.log("Login successful, redirecting...")
            navigate("/") 
        } catch (err) {
            console.error("Login failed:", err)
            setError(err.response?.data?.message || "Invalid credentials or login failed.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-3xl font-bold">Sign in to Werfie</h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}
                
                <Input
                    placeholder="Email, phone, or username"
                    className="h-14 text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                />

                <Input
                    type="password"
                    placeholder="Password"
                    className="h-14 text-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                />

                <Button 
                    type="submit" 
                    className="h-12 rounded-full text-lg font-bold"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Log in"}
                </Button>
            </form>

            <div className="text-muted-foreground text-center">
                Don't have an account?{" "}
                <button onClick={openSignup} className="text-primary hover:underline">
                    Sign up
                </button>
            </div>
        </div>
    )
}
