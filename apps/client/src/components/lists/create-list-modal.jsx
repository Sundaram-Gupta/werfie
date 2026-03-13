import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera } from "lucide-react"
import { useState } from "react"
import { listService } from "@/services/api"
import { toast } from "sonner"

export function CreateListModal({ open, onOpenChange, onSuccess }) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e?.preventDefault()
        if (!name.trim()) {
            toast.error("Please enter a list name")
            return
        }
        setLoading(true)
        try {
            await listService.createList({ name: name.trim(), description: description.trim(), isPrivate })
            toast.success("List created successfully")
            setName("")
            setDescription("")
            setIsPrivate(false)
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Create list failed:", error)
            toast.error("Failed to create list")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (isOpen) => {
        if (!isOpen && !loading) {
            setName("")
            setDescription("")
            setIsPrivate(false)
        }
        onOpenChange(isOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md bg-background border-border">
                <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                    <DialogTitle>Create a new List</DialogTitle>
                    <DialogDescription className="sr-only">Create a new list with name and description</DialogDescription>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-4"
                    >
                        {loading ? "Creating..." : "Next"}
                    </Button>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image placeholder */}
                    <div className="flex justify-center">
                        <button
                            type="button"
                            className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-muted-foreground/60 hover:bg-white/[0.03] transition-colors"
                        >
                            <Camera className="w-10 h-10 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Input
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 border-border"
                        />
                        <Textarea
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[80px] border-border resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Make private */}
                    <div className="flex items-start justify-between gap-4 py-2">
                        <div>
                            <p className="font-medium">Make private</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                When you make a List private, only you can see it.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20 mt-1 cursor-pointer"
                        />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
