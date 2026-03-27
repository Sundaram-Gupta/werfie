import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import api from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

const BusinessAccessContext = createContext(null)

/**
 * Server-driven business access (see GET /api/business/access). Use for routing only;
 * sensitive actions are still enforced on the API.
 */
export function BusinessAccessProvider({ children }) {
    const { user } = useAuth()
    const [access, setAccess] = useState(null)
    const [loading, setLoading] = useState(true)

    const buildLegacyAccess = useCallback(async (uid) => {
        let profile = null
        let members = []

        try {
            const { data } = await api.get("/api/business")
            profile = data || null
        } catch {
            profile = null
        }

        try {
            const { data } = await api.get("/api/business/team")
            members = Array.isArray(data) ? data : []
        } catch {
            members = []
        }

        const selfMember = members.find((m) => String(m.userId) === String(uid))
        const role = selfMember?.role?.toLowerCase() === "admin" ? "admin" : selfMember ? "member" : profile ? "admin" : null
        const hasBusiness = !!profile || !!selfMember || members.length > 0
        const onboardingCompleted = Boolean(profile?.onboardingCompleted ?? profile?.companyName)
        const isAdmin = role === "admin"
        const permissions = {
            TEAM_MANAGE: isAdmin,
            ROLE_UPDATE: isAdmin,
            INVITE_MEMBER: isAdmin,
            REMOVE_MEMBER: isAdmin,
            POST_CREATE: !!role,
            POST_EDIT: !!role,
            POST_DELETE: !!role,
            PRODUCT_MANAGE: !!role,
            AD_CREATE: isAdmin,
            AD_MANAGE: isAdmin,
            VIEW_ANALYTICS: isAdmin,
            SETTINGS_UPDATE: isAdmin,
        }

        return {
            hasBusiness,
            role,
            businessId: profile?.id || selfMember?.businessId || null,
            isOwner: !!profile && String(profile.userId || "") === String(uid),
            onboardingCompleted,
            canAccessDashboard: hasBusiness,
            canManageTeam: isAdmin,
            canManageAds: isAdmin,
            canManageProducts: !!role,
            canViewAnalytics: isAdmin,
            canUpdateSettings: isAdmin,
            permissions,
        }
    }, [])

    const refreshAccess = useCallback(async () => {
        const uid = user?.id || user?._id
        if (!user || !uid) {
            setAccess(null)
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const { data } = await api.get("/api/business/access", {
                params: { _ts: Date.now() },
            })
            setAccess(data)
        } catch (e) {
            const status = e?.response?.status
            if (status === 401 || status === 403) {
                // Auth issue: let route guards handle as no access / login state.
                setAccess(null)
            } else {
                // Resilient fallback for transient network/proxy issues.
                const legacy = await buildLegacyAccess(uid)
                setAccess(legacy)
            }
            console.warn("[BusinessAccess] fetch failed; fallback used when possible", e)
        } finally {
            setLoading(false)
        }
    }, [user?.id, user?._id, buildLegacyAccess])

    useEffect(() => {
        void refreshAccess()
    }, [refreshAccess])

    const value = useMemo(
        () => ({
            access,
            loading,
            refreshAccess,
        }),
        [access, loading, refreshAccess]
    )

    return <BusinessAccessContext.Provider value={value}>{children}</BusinessAccessContext.Provider>
}

export function useBusinessAccess() {
    const ctx = useContext(BusinessAccessContext)
    if (!ctx) {
        throw new Error("useBusinessAccess must be used within BusinessAccessProvider")
    }
    return ctx
}
