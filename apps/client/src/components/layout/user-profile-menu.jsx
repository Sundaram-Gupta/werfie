import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, LogOut, UserPlus, BadgeCheck } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { getMediaUrl } from "@/lib/utils"

import { useTranslation } from "react-i18next"

export function UserProfileMenu() {
    const { user, logout } = useAuth()
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const handleSwitchAccount = () => {
        logout()
        navigate('/login')
    }

    // Get user info from stored user or auth context
    const userName = user?.profile?.name || user?.name || 'User'
    const userHandle = user?.profile?.handle || user?.handle || user?.email?.split('@')[0] || 'user'
    const userAvatar = user?.profile?.avatar || user?.avatar || '/websplash.png'

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-3 rounded-full hover:bg-white/[0.03] transition-colors w-full group">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={getMediaUrl(userAvatar)} />
                        <AvatarFallback>{userName[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left hidden xl:block min-w-0">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-[15px] truncate">{userName}</span>
                            {user?.profile?.verified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                        </div>
                        <span className="text-muted-foreground text-[15px] truncate block">@{userHandle}</span>
                    </div>
                    <MoreHorizontal className="w-5 h-5 hidden xl:block" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 bg-black border-border"
                align="start"
                side="top"
            >
                <DropdownMenuItem
                    onClick={handleSwitchAccount}
                    className="cursor-pointer hover:bg-white/[0.03] p-3"
                >
                    <UserPlus className="w-4 h-4 mr-3" />
                    <span>{t('profile_menu.login_another_account')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-white/[0.03] p-3 text-red-500 focus:text-red-500"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span>{t('profile_menu.logout_user', { userHandle })}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
