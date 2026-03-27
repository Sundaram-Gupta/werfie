import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useBusinessAccess } from "@/context/BusinessAccessContext"

/** /business → onboarding or dashboard based on GET /api/business/access */
export default function BusinessIndexRedirect() {
    const navigate = useNavigate()
    const { access, loading, refreshAccess } = useBusinessAccess()
    const retriedRef = useRef(false)

    useEffect(() => {
        if (loading) return
        if (!access) {
            if (!retriedRef.current) {
                retriedRef.current = true
                void refreshAccess()
                return
            }
            navigate("/business/no-access", { replace: true })
            return
        }
        if (!access?.hasBusiness) {
            navigate("/business/onboarding", { replace: true })
            return
        }
        if (access?.isOwner && !access?.onboardingCompleted) {
            navigate("/business/onboarding", { replace: true })
            return
        }
        if (access?.canAccessDashboard) {
            navigate("/business/dashboard", { replace: true })
            return
        }
        navigate("/business/no-access", { replace: true })
    }, [loading, access, navigate, refreshAccess])

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm">Loading business workspace…</p>
        </div>
    )
}
