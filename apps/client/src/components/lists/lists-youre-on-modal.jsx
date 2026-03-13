import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export function ListsYoureOnModal({ open, onOpenChange, userHandle }) {
    const handle = userHandle ? (userHandle.startsWith('@') ? userHandle : `@${userHandle}`) : '@user'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-background border-border">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold">Lists you're on</DialogTitle>
                    <p className="text-sm text-muted-foreground font-normal">{handle}</p>
                </DialogHeader>
                <div className="py-8 text-center">
                    <p className="font-bold text-[17px] mb-2">You haven't been added to any Lists yet</p>
                    <p className="text-[15px] text-muted-foreground">
                        When someone adds you to a List, it'll show up here.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
