import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal,
    UserPlus,
    UserMinus,
    Star,
    List,
    VolumeX,
    Ban,
    BarChart2,
    Code2,
    Flag,
    Info
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function MoreOptionsDropdown({ user }) {
    const [isFollowing, setIsFollowing] = useState(false)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-blue-500 rounded-full p-2 hover:bg-blue-500/10 transition-colors -mr-2 outline-none">
                    <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 bg-black border border-[rgb(47,51,54)] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] p-0 overflow-hidden" align="end">
                <DropdownMenuItem
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={() => setIsFollowing(!isFollowing)}
                >
                    {isFollowing ? (
                        <>
                            <UserMinus className="w-[18px] h-[18px]" />
                            <span>Unfollow @{user.handle}</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-[18px] h-[18px]" />
                            <span>Follow @{user.handle}</span>
                        </>
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]">
                    <Star className="w-[18px] h-[18px]" />
                    <span>Subscribe to @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]">
                    <List className="w-[18px] h-[18px]" />
                    <span>Add/remove from Lists</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]">
                    <VolumeX className="w-[18px] h-[18px]" />
                    <span>Mute @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)] group">
                    <Ban className="w-[18px] h-[18px] group-hover:text-red-500" />
                    <span className="group-hover:text-red-500">Block @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[rgb(47,51,54)] m-0" />

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]">
                    <BarChart2 className="w-[18px] h-[18px]" />
                    <span>View post engagements</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]">
                    <Code2 className="w-[18px] h-[18px]" />
                    <span>Embed post</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)] group">
                    <Flag className="w-[18px] h-[18px] group-hover:text-red-500" />
                    <span className="group-hover:text-red-500">Report post</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]">
                    <Info className="w-[18px] h-[18px]" />
                    <span>Request Community Note</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
