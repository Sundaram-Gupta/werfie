import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ShieldX, Mail } from "lucide-react"

export default function BusinessNoAccess() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldX className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold">No access to this workspace</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    You don’t have permission to open the business dashboard. Ask an admin to invite you to the team,
                    or switch back to your personal account.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <Button
                        variant="outline"
                        className="rounded-full border-white/20"
                        onClick={() => navigate("/", { replace: true })}
                    >
                        Back to Werfie
                    </Button>
                    <Button
                        className="rounded-full bg-[rgb(29,155,240)] text-white"
                        onClick={() => (window.location.href = `mailto:support@werfie.com?subject=Business%20access`)}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Contact support
                    </Button>
                </div>
            </div>
        </div>
    )
}
