import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
    Info,
    Trash2
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { userService, moderationService, listService } from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { AddToListModal } from "../lists/add-to-list-modal"

export function MoreOptionsDropdown({ user, contentType = 'post', contentId, onDelete }) {
    const { user: currentUser } = useAuth()
    const [isFollowing, setIsFollowing] = useState(false)
    const [isReporting, setIsReporting] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showListsModal, setShowListsModal] = useState(false)

    const isOwner = currentUser?.id === user.id || currentUser?.id === user.userId 

    const handleDelete = async () => {
        if (!onDelete) return;
        
        try {
            await onDelete(contentId);
            toast.success('Post deleted successfully');
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete post');
        } finally {
            setShowDeleteDialog(false);
        }
    }

    const handleFollow = async (e) => {
        e.stopPropagation();
        try {
            if (isFollowing) {
                await userService.unfollowUser(user.id);
                setIsFollowing(false);
                toast.success(`Unfollowed @${user.handle}`);
            } else {
                await userService.followUser(user.id);
                setIsFollowing(true);
                toast.success(`Following @${user.handle}`);
            }
        } catch (error) {
            console.error('Follow action failed:', error);
            toast.error('Failed to update follow status');
        }
    }

    const handleEmbed = (e) => {
        e.stopPropagation();
        const postUrl = `${window.location.origin}/post/${contentId}`;
        navigator.clipboard.writeText(postUrl);
        toast.success('Post link copied to clipboard!');
    };

    const handleComingSoon = (e, feature) => {
        e.stopPropagation();
        toast.info(`${feature} is coming soon!`);
    };

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
        <>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to delete this post?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This post will be permanently removed from your profile and search results.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button 
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                {isOwner && (
                    <>
                        <DropdownMenuItem 
                            className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-red-500 hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)] focus:text-red-500"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteDialog(true);
                            }}
                        >
                            <Trash2 className="w-[18px] h-[18px]" />
                            <span>Delete post</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[rgb(47,51,54)] m-0" />
                    </>
                )}
                <DropdownMenuItem
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={handleFollow}
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
                    onClick={(e) => handleComingSoon(e, 'Subscriptions')}
                >
                    <Star className="w-[18px] h-[18px]" />
                    <span>Subscribe to @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowListsModal(true);
                    }}
                >
                    <List className="w-[18px] h-[18px]" />
                    <span>Add/remove from Lists</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => handleComingSoon(e, 'Muting')}
                >
                    <VolumeX className="w-[18px] h-[18px]" />
                    <span>Mute @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)] group"
                    onClick={(e) => handleComingSoon(e, 'Blocking')}
                >
                    <Ban className="w-[18px] h-[18px] group-hover:text-red-500" />
                    <span className="group-hover:text-red-500">Block @{user.handle}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[rgb(47,51,54)] m-0" />

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={(e) => handleComingSoon(e, 'Post analytics')}
                >
                    <BarChart2 className="w-[18px] h-[18px]" />
                    <span>View post engagements</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                    className="flex gap-3 px-4 py-3 cursor-pointer text-[15px] font-bold text-white hover:bg-[rgb(22,24,28)] focus:bg-[rgb(22,24,28)]"
                    onClick={handleEmbed}
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
                    onClick={(e) => handleComingSoon(e, 'Community Notes')}
                >
                    <Info className="w-[18px] h-[18px]" />
                    <span>Request Community Note</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            
            <AddToListModal 
                open={showListsModal} 
                onOpenChange={setShowListsModal}
                user={user}
            />
        </DropdownMenu>
        </>
    )
}
