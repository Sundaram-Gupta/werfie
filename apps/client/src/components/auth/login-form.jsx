import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthModal } from "./auth-modal-context"

export function LoginForm() {
    const { openSignup } = useAuthModal()

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle login logic here
        console.log("Login submitted")
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-3xl font-bold">Sign in to Werfie</h1>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input placeholder="Email, phone, or username" className="h-14 text-lg" />
                <Input type="password" placeholder="Password" className="h-14 text-lg" />
                <Button type="submit" className="h-12 rounded-full text-lg font-bold">
                    Log in
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
