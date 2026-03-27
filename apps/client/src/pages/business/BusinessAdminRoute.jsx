import { Loader2 } from "lucide-react"
import { Navigate } from "react-router-dom"
import { useBusinessAccess } from "@/context/BusinessAccessContext"

/** Permission-driven route guard. Backend remains source of truth. */
export default function BusinessAdminRoute({ children, requiredPermission = "TEAM_MANAGE" }) {
    const { access, loading } = useBusinessAccess()

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    if (!access?.permissions?.[requiredPermission]) {
        return <Navigate to="/business/dashboard" replace />
    }

    return children
}
