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
import { moderationService } from "@/services/api"
import { toast } from "sonner"

export function MoreOptionsDropdown({ user, contentType = 'post', contentId }) {
    const [isFollowing, setIsFollowing] = useState(false)
    const [isReporting, setIsReporting] = useState(false)

    const handleReport = async (e) => {
        e.stopPropagation();
        if (isReporting) return;
        
        setIsReporting(true);
        try {
            await moderationService.reportContent(contentType, contentId, 'Reported from more options');
            toast.success('Thank you for your report. We will review this content.');
        } catch (error) {
            console.error('Report failed:', error);
            toast.error('Failed to submit report. Please try again.');
        } finally {
            setIsReporting(false);
        }
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button 
                    className="text-muted-foreground hover:text-blue-500 rounded-full p-2 hover:bg-blue-500/10 transition-colors -mr-2 outline-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="w-[18px] h-[18px]" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                className="w-72 bg-black border border-[rgb(47,51,54)] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.2)] p-0 overflow-hidden" 
                align="end"
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenuItem
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsFollowing(!isFollowing);
                    }}
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

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Star className="w-[18px] h-[18px]" />
                    <span>Subscribe to @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <List className="w-[18px] h-[18px]" />
                    <span>Add/remove from Lists</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <VolumeX className="w-[18px] h-[18px]" />
                    <span>Mute @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)] group"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Ban className="w-[18px] h-[18px] group-hover:text-red-500" />
                    <span className="group-hover:text-red-500">Block @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[rgb(47,51,54)] m-0" />

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <BarChart2 className="w-[18px] h-[18px]" />
                    <span>View post engagements</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Code2 className="w-[18px] h-[18px]" />
                    <span>Embed post</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)] group disabled:opacity-50"
                    onClick={handleReport}
                    disabled={isReporting}
                >
                    <Flag className={cn("w-[18px] h-[18px] group-hover:text-red-500", isReporting && "animate-pulse")} />
                    <span className="group-hover:text-red-500">{isReporting ? 'Reporting...' : 'Report post'}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Info className="w-[18px] h-[18px]" />
                    <span>Request Community Note</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
