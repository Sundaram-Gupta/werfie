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
import { Camera, ImagePlus } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { listService, mediaService } from "@/services/api"
import { toast } from "sonner"
import { getMediaUrl } from "@/lib/utils"

export function EditListModal({ open, onOpenChange, list, onSuccess }) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [banner, setBanner] = useState("")
    const [avatar, setAvatar] = useState("")
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const bannerInputRef = useRef(null)
    const avatarInputRef = useRef(null)

    useEffect(() => {
        if (list) {
            setName(list.name || "")
            setDescription(list.description || "")
            setIsPrivate(!!list.isPrivate)
            setBanner(list.banner || "")
            setAvatar(list.avatar || "")
        }
    }, [list, open])

    const handleBannerUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file?.type?.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }
        setUploading(true)
        try {
            const result = await mediaService.uploadMedia(file)
            const url = result?.url ?? result?.data?.url ?? result
            if (url) setBanner(typeof url === "string" ? url : url.url)
        } catch (err) {
            console.error("Banner upload failed:", err)
            toast.error("Failed to upload banner")
        } finally {
            setUploading(false)
        }
    }

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file?.type?.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }
        setUploading(true)
        try {
            const result = await mediaService.uploadMedia(file)
            const url = result?.url ?? result?.data?.url ?? result
            if (url) setAvatar(typeof url === "string" ? url : url.url)
        } catch (err) {
            console.error("Avatar upload failed:", err)
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        if (!list?.id || !name.trim()) {
            toast.error("Please enter a list name")
            return
        }
        setLoading(true)
        try {
            const updated = await listService.updateList(list.id, {
                name: name.trim(),
                description: description.trim(),
                isPrivate,
                banner: banner || undefined,
                avatar: avatar || undefined,
            })
            toast.success("List updated successfully")
            onOpenChange(false)
            onSuccess?.(updated)
        } catch (error) {
            console.error("Edit list failed:", error)
            toast.error("Failed to update list")
        } finally {
            setLoading(false)
        }
    }

    if (!list) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-background border-border">
                <DialogHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                    <DialogTitle>Edit List</DialogTitle>
                    <DialogDescription className="sr-only">Edit list name, description, banner and image</DialogDescription>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                        className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-4"
                    >
                        {loading ? "Saving..." : uploading ? "Uploading..." : "Save"}
                    </Button>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Banner */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Banner</p>
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerUpload}
                        />
                        <button
                            type="button"
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-muted-foreground/60 hover:bg-white/[0.03] transition-colors overflow-hidden"
                        >
                            {banner ? (
                                <img src={getMediaUrl(banner)} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <ImagePlus className="w-6 h-6" /> Add cover image
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Avatar */}
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">List image</p>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploading}
                            className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-muted-foreground/60 hover:bg-white/[0.03] transition-colors overflow-hidden"
                        >
                            {avatar ? (
                                <img src={getMediaUrl(avatar)} alt="List" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="w-10 h-10 text-muted-foreground" />
                            )}
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
