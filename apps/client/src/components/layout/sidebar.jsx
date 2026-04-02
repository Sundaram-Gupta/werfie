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
import { SubmitAppealModal } from "@/components/modals/SubmitAppealModal"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"



export function Sidebar() {
    const location = useLocation()
    const { openLogin } = useAuthModal()
    const { user } = useAuth()
    const { t } = useTranslation()
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark")
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    const navItems = [
        { icon: Home, filledIcon: HomeFilledIcon, label: t('nav.home'), path: "/", filledActive: true },
        { icon: Search, label: t('nav.explore'), path: "/explore", outlineActive: true },
        { icon: Bell, label: t('nav.notifications'), path: "/notifications" },
        { icon: Brain, label: t('nav.werfie_ai'), path: "/werfie-ai", gradient: true },
        { icon: Users, label: t('nav.follow'), path: "/follow" },
        { icon: Bookmark, label: "Bookmark", path: "/bookmarks" },
        { icon: Mail, filledIcon: MailFilledIcon, label: t('nav.chat'), path: "/chat", filledActive: true },
        ...((user?.profile?.verified || user?.institutionalProfile?.isVerified) && (user?.institutionType || user?.institutionalProfile) ? [{ icon: Megaphone, label: "Official Announcements", path: "/announcements" }] : []),
        { icon: Globe, label: "World Leaders", path: "/world-leaders" },
        { icon: User, label: t('nav.profile'), path: "/profile" },
        { icon: MoreHorizontal, label: t('nav.more'), isMore: true },
    ]

    return (
        <nav className="w-[88px] xl:w-[275px] h-screen sticky top-0 border-r border-border/50 px-2 flex flex-col items-center xl:items-start justify-between py-2 overflow-y-auto no-scrollbar">
            <div className="w-full flex flex-col items-center xl:items-start space-y-1">
                {/* Logo */}
                {/* Logo */}
                <Link to="/" className="p-3 mb-1 xl:ml-0 hover:bg-muted/50 rounded-full transition cursor-pointer block">
                    <img src="/websplash.png" alt="X" className="w-8 h-8 min-w-8 dark:invert" />
                </Link>

                {/* Nav Items */}
                {navItems.map((item) => {
                    if (item.isMore) {
                        return (
                            <DropdownMenu key="More">
                                <DropdownMenuTrigger asChild>
                                    <div className={cn(
                                        "flex items-center gap-4 text-[20px] px-4 rounded-full w-max xl:w-min xl:pr-8 transition hover:bg-gray-200 dark:hover:bg-zinc-900 cursor-pointer",
                                        "h-[50px]"
                                    )}>
                                        <item.icon className="w-[26.25px] h-[26.25px]" />
                                        <span className="hidden xl:inline leading-6">{item.label}</span>
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[300px] mb-2 bg-background border border-border/20 rounded-xl shadow-xl p-0 overflow-hidden" align="start" side="top">
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
                                    <DropdownMenuItem onClick={() => setIsAppealModalOpen(true)} className="flex items-center gap-3 px-4 py-3 text-[15px] font-bold cursor-pointer">
                                        <ShieldAlert className="w-[18px] h-[18px] text-yellow-500" />
                                        Submit an Appeal
                                    </DropdownMenuItem>
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
                                "flex items-center gap-4 text-[20px] px-4 rounded-full w-max xl:w-min xl:pr-8 transition hover:bg-gray-200 dark:hover:bg-zinc-900",
                                isActive ? "font-bold" : "font-normal",
                                item.gradient && "bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:via-blue-500/20 hover:to-cyan-500/20"
                            )}
                            style={{ height: '50px' }}
                        >
                            {isActive && item.filledIcon ? (
                                <item.filledIcon
                                    className={cn(
                                        "w-[26.25px] h-[26.25px] shrink-0",
                                        "text-foreground"
                                    )}
                                />
                            ) : (
                                <item.icon
                                    className={cn(
                                        "w-[26.25px] h-[26.25px] shrink-0",
                                        !item.gradient && (isActive ? "text-foreground" : "text-foreground/70"),
                                        item.gradient && "text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    fill="none"
                                    style={item.gradient ? { stroke: "url(#gradient)" } : {}}
                                />
                            )}
                            <span className={cn(
                                "hidden xl:inline leading-6 whitespace-nowrap",
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
                        className="mt-4 bg-primary text-primary-foreground font-bold text-[17px] rounded-full w-[52px] h-[52px] xl:h-[52px] xl:w-[90%] hover:opacity-90 transition shadow-lg flex items-center justify-center transform active:scale-95 duration-200"
                    >
                        <span className="hidden xl:inline">{t('nav.post')}</span>
                        <Feather className="xl:hidden w-6 h-6" />
                    </button>
                </ComposeModal>
            </div>

            {/* User Profile */}
            <div className="w-full mb-4 px-2 xl:px-0">
                <UserProfileMenu />
            </div>

            <SubmitAppealModal 
                isOpen={isAppealModalOpen} 
                onClose={() => setIsAppealModalOpen(false)} 
            />
        </nav>
    )
}
