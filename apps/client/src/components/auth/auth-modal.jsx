import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAuthModal } from "./auth-modal-context"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import logo from "@/assets/logo-final.png"

export function AuthModal() {
    const { isOpen, close, view } = useAuthModal()

    return (
        <Dialog open={isOpen} onOpenChange={close}>
            <DialogContent className="sm:max-w-[600px] min-h-[400px] p-12 bg-background border-none rounded-2xl">
                <VisuallyHidden>
                    <DialogTitle>{view === "login" ? "Sign in" : "Sign up"}</DialogTitle>
                </VisuallyHidden>
                <div className="flex justify-center mb-8">
                    <img src={logo} alt="App logo" className="h-14 w-auto invert dark:invert-0" />
                </div>

                {view === "login" ? <LoginForm /> : <SignupForm />}
            </DialogContent>
        </Dialog>
    )
}
