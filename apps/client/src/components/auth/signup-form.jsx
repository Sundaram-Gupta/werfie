import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthModal } from "./auth-modal-context"

export function SignupForm() {
    const { openLogin } = useAuthModal()

    const handleSubmit = (e) => {
        e.preventDefault()
        // Handle signup logic
        console.log("Signup submitted")
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 text-center">
                <h1 className="text-3xl font-bold">Create your account</h1>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input placeholder="Name" className="h-14 text-lg" />
                <Input placeholder="Email" className="h-14 text-lg" />
                <div className="flex flex-col gap-2">
                    <h3 className="font-bold">Date of birth</h3>
                    <p className="text-muted-foreground text-sm">This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.</p>
                    {/* Simplified Date Picker Placeholder */}
                    <div className="flex gap-2">
                        <Input placeholder="Month" className="h-14 text-lg flex-1" />
                        <Input placeholder="Day" className="h-14 text-lg w-24" />
                        <Input placeholder="Year" className="h-14 text-lg w-24" />
                    </div>
                </div>
                <Button type="submit" className="h-12 rounded-full text-lg font-bold mt-4">
                    Sign up
                </Button>
            </form>
            <div className="text-muted-foreground text-center">
                Have an account already?{" "}
                <button onClick={openLogin} className="text-primary hover:underline">
                    Log in
                </button>
            </div>
        </div>
    )
}
