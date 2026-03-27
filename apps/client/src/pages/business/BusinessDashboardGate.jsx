import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useBusinessAccess } from "@/context/BusinessAccessContext"

/** Wraps dashboard layout: requires completed onboarding and server canAccessDashboard */
export default function BusinessDashboardGate() {
    const navigate = useNavigate()
    const location = useLocation()
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
            navigate("/business/onboarding", { replace: true, state: { from: location.pathname } })
            return
        }
        // Onboarding requirement is for business owners only.
        // Members can access the shared dashboard without completing owner onboarding.
        if (access?.isOwner && !access?.onboardingCompleted) {
            navigate("/business/onboarding", { replace: true, state: { from: location.pathname } })
            return
        }
        if (!access?.canAccessDashboard) {
            navigate("/business/no-access", { replace: true })
        }
    }, [loading, access, navigate, location.pathname, refreshAccess])

    if (loading || !access?.canAccessDashboard) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-sm">Preparing dashboard…</p>
            </div>
        )
    }

    return <Outlet />
}
