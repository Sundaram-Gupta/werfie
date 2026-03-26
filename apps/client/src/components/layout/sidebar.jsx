import { Link, useLocation } from "react-router-dom"
import { Home, Search, Bell, Users, Mail, User, MoreHorizontal, Feather, Sparkles, List, Briefcase, Megaphone, Mic, Settings, Sun, Moon, Brain, Wallet, ShieldAlert, Globe, Activity, ShieldCheck, Gavel, Bookmark } from "lucide-react"
import { HomeFilledIcon, MailFilledIcon } from "@/components/icons/nav-icons"
import { cn } from "@/lib/utils"
import { useAuthModal } from "../auth/auth-modal-context"
import { useAuth } from "@/context/AuthContext"
import { UserProfileMenu } from "./user-profile-menu"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ComposeModal } from "@/components/feed/compose-modal"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"



export function Sidebar({ forceCollapsed = false } = {}) {
    const location = useLocation()
    const { openLogin } = useAuthModal()
    const { user } = useAuth()
    const { t } = useTranslation()
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark")

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    const triggerHomeRefresh = (e) => {
        // If we're already on Home, clicking Home should refresh the feed (no full reload).
        if (location.pathname === "/") {
            e?.preventDefault?.()
            try {
                window.dispatchEvent(new Event("feed-full-refresh"))
            } catch {
                // ignore
            }
            // UX: bring user to the post composer box.
            try {
                const el = document.getElementById('home-post-composer')
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                else window.scrollTo({ top: 0, behavior: "smooth" })
            } catch {
                window.scrollTo(0, 0)
            }
        }
    }

    const navItems = [
        { icon: Home, filledIcon: HomeFilledIcon, label: t('nav.home'), path: "/", filledActive: true },
        { icon: Search, label: t('nav.explore'), path: "/explore", outlineActive: true },
        { icon: Bell, label: t('nav.notifications'), path: "/notifications" },
        { icon: Brain, label: t('nav.werfie_ai'), path: "/werfie-ai", gradient: true },
        { icon: Users, label: t('nav.follow'), path: "/follow" },
        { icon: Bookmark, label: t('nav.bookmark'), path: "/bookmarks" },
        { icon: Mail, filledIcon: MailFilledIcon, label: t('nav.chat'), path: "/chat", filledActive: true },
        ...((user?.profile?.verified || user?.institutionalProfile?.isVerified) && (user?.institutionType || user?.institutionalProfile) ? [{ icon: Megaphone, label: "Official Announcements", path: "/announcements" }] : []),
        { icon: Globe, label: "World Leaders", path: "/world-leaders" },
        { icon: User, label: t('nav.profile'), path: "/profile" },
        { icon: MoreHorizontal, label: t('nav.more'), isMore: true },
    ]

    return (
        <nav
            className={cn(
                "h-screen sticky top-0 flex flex-col justify-between overflow-y-auto no-scrollbar",
                // Match the slim X-style rail in collapsed mode
                forceCollapsed
                    ? "bg-black border-r border-white/10 px-2 py-3"
                    : "bg-black border-r border-white/10 px-3 py-3",
                forceCollapsed ? "w-[88px] items-center" : "w-[88px] xl:w-[275px] items-center xl:items-start"
            )}
        >
            <div className={cn("w-full flex flex-col", forceCollapsed ? "items-center space-y-2" : "items-center xl:items-start space-y-1.5")}>
                {/* Logo */}
                {/* Logo */}
                <Link
                    to="/"
                    className={cn(
                        "rounded-full transition cursor-pointer block",
                        forceCollapsed ? "p-2 mb-1 hover:bg-white/5" : "p-3 mb-1 xl:ml-0 hover:bg-muted/50"
                    )}
                    onClick={triggerHomeRefresh}
                >
                    <img
                        src="/werfie.png"
                        alt="Werfie"
                        className={cn("w-7 h-7 min-w-7")}
                    />
                </Link>

                {/* Nav Items */}
                {navItems.map((item) => {
                    if (item.isMore) {
                        return (
                            <DropdownMenu key="More">
                                <DropdownMenuTrigger asChild>
                                    <div className={cn(
                                        "flex items-center rounded-full cursor-pointer select-none",
                                        forceCollapsed
                                            ? "h-[48px] w-[48px] justify-center text-white/80 hover:bg-white/5 hover:text-white"
                                            : "h-[52px] px-4 gap-4 w-max xl:w-full xl:pr-6 text-white/90 hover:bg-white/5 hover:text-white",
                                    )}>
                                        <item.icon className={cn(forceCollapsed ? "w-7 h-7" : "w-[26.25px] h-[26.25px]")} />
                                        <span className={cn("leading-6", forceCollapsed ? "hidden" : "hidden xl:inline")}>{item.label}</span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    // Render to the right so it doesn't get clipped by viewport height on mobile,
                                    // and keep shadow visible (no overflow-hidden).
                                    className="w-[300px] bg-background border border-border/20 rounded-xl shadow-2xl p-0"
                                    align="start"
                                    side="right"
                                    sideOffset={12}
                                    collisionPadding={12}
                                >
                                    <Link to="/creator-studio">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Sparkles className="w-[18px] h-[18px]" />
                                            {t('more_menu.creator_studio')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/lists">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <List className="w-[18px] h-[18px]" />
                                            {t('more_menu.lists')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/business">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Briefcase className="w-[18px] h-[18px]" />
                                            {t('more_menu.business')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/ads">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Megaphone className="w-[18px] h-[18px]" />
                                            {t('more_menu.ads')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/monetization">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Wallet className="w-[18px] h-[18px]" />
                                            Monetization
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/spaces">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Mic className="w-[18px] h-[18px]" />
                                            {t('more_menu.create_space')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/settings">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Settings className="w-[18px] h-[18px]" />
                                            {t('more_menu.settings_privacy')}
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/enterprise">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Activity className="w-[18px] h-[18px]" />
                                            Enterprise Intelligence
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/crisis-command">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <ShieldAlert className="w-[18px] h-[18px]" />
                                            Crisis Command View
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/debate">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Gavel className="w-[18px] h-[18px]" />
                                            Debate Framework
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/soapbox">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <Mic className="w-[18px] h-[18px]" />
                                            Soapbox Mode
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link to="/moderation">
                                        <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                            <ShieldCheck className="w-[18px] h-[18px]" />
                                            Comments Moderation
                                        </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                        {theme === "dark" ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
                                        {t('more_menu.theme')}: {theme === "dark" ? t('more_menu.dark') : t('more_menu.light')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }

                    const isActive = location.pathname === item.path
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={cn(
                                "flex items-center rounded-full relative",
                                forceCollapsed
                                    ? "h-[52px] w-[52px] justify-center text-white/80 hover:bg-white/5 hover:text-white"
                                    : cn(
                                        "h-[52px] gap-4 px-4 w-max xl:w-full xl:pr-6 text-[19px] text-white/90 hover:bg-white/5 hover:text-white",
                                        isActive ? "bg-white/10 text-white font-semibold" : "font-normal"
                                    ),
                                item.gradient && "bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:via-blue-500/20 hover:to-cyan-500/20"
                            )}
                            onClick={item.path === "/" ? triggerHomeRefresh : undefined}
                        >
                            {isActive && item.filledIcon ? (
                                <item.filledIcon
                                    className={cn(
                                        "w-[26.25px] h-[26.25px] shrink-0",
                                        forceCollapsed ? "text-white" : "text-white"
                                    )}
                                />
                            ) : (
                                <item.icon
                                    className={cn(
                                        forceCollapsed ? "w-7 h-7 shrink-0" : "w-[26.25px] h-[26.25px] shrink-0",
                                        !item.gradient && (isActive ? (forceCollapsed ? "text-white" : "text-foreground") : (forceCollapsed ? "text-white/70" : "text-foreground/70")),
                                        item.gradient && "text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    fill="none"
                                    style={item.gradient ? { stroke: "url(#gradient)" } : {}}
                                />
                            )}
                            {forceCollapsed && isActive && (
                                <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(0,0,0,0.9)]" />
                            )}
                            <span className={cn(
                                forceCollapsed ? "hidden" : "hidden xl:inline",
                                "leading-6 whitespace-nowrap",
                                item.gradient && "bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent"
                            )}>
                                {item.label}
                            </span>
                            {item.gradient && (
                                <svg width="0" height="0">
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#a855f7" />
                                            <stop offset="50%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            )}
                        </Link>
                    )
                })}

                {/* Post Button */}
                <ComposeModal>
                    <button
                        className={cn(
                            "font-bold rounded-full transition shadow-lg flex items-center justify-center transform active:scale-95 duration-200",
                            forceCollapsed
                                ? "mt-2 bg-white text-black hover:bg-white/90 shadow-xl w-[52px] h-[52px]"
                                : "mt-4 bg-white text-black hover:bg-white/95 shadow-xl w-[52px] h-[52px] xl:w-full xl:h-[54px] xl:px-6"
                        )}
                    >
                        <span className={cn("hidden xl:inline", forceCollapsed && "hidden")}>{t('nav.post')}</span>
                        <Feather className={cn("w-6 h-6", forceCollapsed ? "" : "xl:hidden")} />
                    </button>
                </ComposeModal>
            </div>

            {/* User Profile */}
            <div className={cn("w-full px-2 xl:px-0", forceCollapsed ? "mb-2 mt-2 flex justify-center" : "mb-3 mt-3")}>
                <UserProfileMenu />
            </div>
        </nav>
    )
}
