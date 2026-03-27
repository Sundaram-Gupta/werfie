import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import {
    LayoutDashboard,
    Store,
    Users,
    Settings,
    ArrowLeft,
    MoreHorizontal,
    Bell,
    ShoppingBag,
    Megaphone,
    CircleDollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, getMediaUrl } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useBusinessAccess } from "@/context/BusinessAccessContext"

const secondaryNav = [
    { to: "/ads", label: "Ads", icon: Megaphone },
    { to: "/monetization", label: "Monetization", icon: CircleDollarSign },
]

const pathTitle = {
    "/business/dashboard": "Professional Home",
    "/business/profile": "Profile",
    "/business/products": "Products",
    "/business/team": "Team",
    "/business/settings": "Settings",
}

function buildNav(role, permissions = {}) {
    const canManageTeam = !!permissions.TEAM_MANAGE
    const canUpdateSettings = !!permissions.SETTINGS_UPDATE
    const items = [
        {
            to: "/business/dashboard",
            end: true,
            label: "Professional Home",
            shortLabel: "Home",
            icon: LayoutDashboard,
        },
    ]
    items.push({ to: "/business/profile", label: "Profile", icon: Store })
    if (permissions.PRODUCT_MANAGE) {
        items.push({ to: "/business/products", label: "Products", icon: ShoppingBag })
    }
    if (canManageTeam) items.push({ to: "/business/team", label: "Team", icon: Users })
    if (canUpdateSettings) items.push({ to: "/business/settings", label: "Settings", icon: Settings })
    return items
}

export default function BusinessLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const { access } = useBusinessAccess()
    const nav = buildNav(access?.role ?? "admin", access?.permissions)
    const showGrowTools = !!access?.permissions?.AD_MANAGE

    const selfDisplayName =
        user?.profile?.name ||
        user?.name ||
        (user?.email ? user.email.split("@")[0] : "Business")
    const selfHandle = user?.profile?.handle || user?.handle || user?.username || "account"
    const selfAvatar = user?.profile?.avatar || user?.avatar
    const displayName = access?.businessName || selfDisplayName
    const handle = selfHandle
    const avatar = access?.businessLogoUrl || access?.ownerAvatar || selfAvatar

    const pageTitle = pathTitle[location.pathname] ?? "Business"

    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
            <aside className="w-64 border-r border-white/10 sticky top-0 h-screen hidden md:flex flex-col bg-black">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
                            W
                        </div>
                        <div>
                            <span className="font-bold text-[15px] tracking-tight block leading-tight">Professionals</span>
                            <span className="text-[11px] text-muted-foreground">Business suite</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                        <Avatar className="h-9 w-9 rounded-full border border-white/10">
                            <AvatarImage src={getMediaUrl(avatar)} alt="" className="object-cover" />
                            <AvatarFallback className="bg-zinc-800 text-xs font-semibold">
                                {displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold truncate text-[13px]">{displayName}</div>
                            <div className="text-[12px] text-muted-foreground truncate">@{handle}</div>
                            <div className="text-[10px] text-[rgb(29,155,240)] mt-0.5 capitalize">
                                {access?.role || "member"}
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {nav.map((item) => (
                        <NavLink
                            key={`${item.to}-${item.label}`}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors text-[15px]",
                                    isActive
                                        ? "font-bold bg-white text-black"
                                        : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}

                    {showGrowTools && (
                        <>
                            <div className="pt-4 pb-1 px-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Grow
                                </p>
                            </div>
                            {secondaryNav.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-full transition-colors text-[15px]",
                                            isActive
                                                ? "font-bold bg-white text-black"
                                                : "text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
                                        )
                                    }
                                >
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </>
                    )}
                </nav>

                <div className="p-3 border-t border-white/10">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
                        onClick={() => navigate("/")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Werfie
                    </Button>
                </div>
            </aside>

            <main className="flex-1 min-w-0 border-r border-white/10 md:border-r-0">
                <div className="md:hidden sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-bold text-[15px]">Professionals</span>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                <header className="hidden md:flex items-center justify-between px-6 lg:px-10 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-10">
                    <h1 className="text-xl font-bold tracking-tight">{pageTitle}</h1>
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground">
                            <Bell className="w-5 h-5" />
                        </Button>
                        {showGrowTools && (
                            <Button
                                className="rounded-full bg-[rgb(29,155,240)] hover:bg-[rgb(26,140,216)] text-white font-bold"
                                onClick={() => navigate("/ads")}
                            >
                                Create ad
                            </Button>
                        )}
                    </div>
                </header>

                <div className="p-4 md:p-6 lg:px-10 max-w-5xl mx-auto pb-24 md:pb-10">
                    <Outlet />
                </div>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 border-t border-white/10 flex justify-around py-2 z-20 safe-area-pb">
                {nav.map((item) => (
                    <NavLink
                        key={`${item.to}-mob-${item.label}`}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg min-w-[56px] text-[10px] font-medium",
                                isActive ? "text-[rgb(29,155,240)]" : "text-muted-foreground"
                            )
                        }
                    >
                        <item.icon className="w-6 h-6" />
                        {item.shortLabel ?? item.label.split(" ")[0]}
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
