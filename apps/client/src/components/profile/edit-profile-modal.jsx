import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef } from "react"
import { userService, mediaService } from "@/services/api"
import { X, Camera, Loader2 } from "lucide-react"
import { cn, getMediaUrl } from "@/lib/utils"

export function EditProfileModal({ user, onUpdate, children }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const bannerInputRef = useRef(null)
    const avatarInputRef = useRef(null)

    const [formData, setFormData] = useState({
        name: user.profile?.name || user.name || "",
        bio: user.profile?.bio || "",
        location: user.profile?.location || "",
        website: user.profile?.website || "",
        banner: user.profile?.banner || user.banner || "",
        avatar: user.profile?.avatar || user.avatar || "",
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleImageUpload = async (e, type) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (type === 'banner') setUploadingBanner(true)
        else setUploadingAvatar(true)

        try {
            const { url } = await mediaService.uploadMedia(file)
            setFormData(prev => ({ ...prev, [type]: url }))
        } catch (error) {
            console.error(`Failed to upload ${type}:`, error)
        } finally {
            if (type === 'banner') setUploadingBanner(false)
            else setUploadingAvatar(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        console.log("Submitting profile update:", formData);
        console.log("Updating User ID:", user.id);

        try {
            if (!user.id) throw new Error("User ID is missing");
            const updated = await userService.updateProfile(user.id, formData)
            console.log("Profile updated successfully:", updated);
            onUpdate(updated)
            setOpen(false)
            // Force reload to ensure all states (header, sidebar, etc.) are synced
            window.location.reload();
        } catch (error) {
            console.error("Failed to update profile:", error)
            alert(`Failed to update profile: ${error.response?.data?.error || error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-black border-zinc-800 p-0 overflow-hidden text-white gap-0 top-[50%] translate-y-[-50%]">
                <DialogHeader className="px-4 py-3 flex flex-row items-center justify-between border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-full p-2 hover:bg-zinc-800 transition -ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <DialogTitle className="text-[20px] font-bold">Edit Profile</DialogTitle>
                        <DialogDescription className="sr-only">Update your profile name, bio, and photos</DialogDescription>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || uploadingBanner || uploadingAvatar}
                        className="bg-white text-black hover:bg-white/90 font-bold rounded-full px-5 h-8 text-[14px]"
                    >
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </DialogHeader>

                <div className="p-0 overflow-y-auto max-h-[80vh]">
                    {/* Banner Upload */}
                    <div className="h-[200px] bg-zinc-800 relative group">
                        {formData.banner ? (
                            <img src={getMediaUrl(formData.banner)} className="w-full h-full object-cover opacity-75 group-hover:opacity-50 transition" />
                        ) : (
                            <div className="w-full h-full bg-zinc-700" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-4">
                            <button
                                onClick={() => bannerInputRef.current?.click()}
                                className="p-3 bg-black/50 rounded-full hover:bg-black/70 transition backdrop-blur-sm"
                            >
                                {uploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                            </button>
                            <input
                                type="file"
                                ref={bannerInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'banner')}
                            />
                        </div>
                    </div>

                    {/* Avatar Upload */}
                    <div className="relative px-4 -mt-[3.5rem] mb-3">
                        <div className="w-[112px] h-[112px] rounded-full border-4 border-black bg-zinc-800 relative group overflow-hidden">
                            {formData.avatar ? (
                                <img src={getMediaUrl(formData.avatar)} className="w-full h-full object-cover opacity-75 group-hover:opacity-50 transition" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500">Avatar</div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="p-3 bg-black/50 rounded-full hover:bg-black/70 transition backdrop-blur-sm"
                                >
                                    {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                </button>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'avatar')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-6">
                        <div className="space-y-2 relative pt-2">
                            <div className="group border border-zinc-500/50 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary px-3 py-1 bg-transparent transition-colors">
                                <Label htmlFor="name" className="text-zinc-500 text-[13px] group-focus-within:text-primary">Name</Label>
                                <input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full bg-transparent border-0 p-0 text-white focus:ring-0 text-[17px] leading-6 placeholder:text-zinc-600"
                                    maxLength={50}
                                />
                            </div>
                            <div className="text-right text-zinc-500 text-[13px] hidden group-focus-within:block">
                                {formData.name.length}/50
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <div className="group border border-zinc-500/50 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary px-3 py-1 bg-transparent transition-colors">
                                <Label htmlFor="bio" className="text-zinc-500 text-[13px] group-focus-within:text-primary">Bio</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="block w-full bg-transparent border-0 p-0 text-white focus:ring-0 text-[17px] leading-6 resize-none min-h-[80px]"
                                    maxLength={160}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <div className="group border border-zinc-500/50 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary px-3 py-1 bg-transparent transition-colors">
                                <Label htmlFor="location" className="text-zinc-500 text-[13px] group-focus-within:text-primary">Location</Label>
                                <input
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="block w-full bg-transparent border-0 p-0 text-white focus:ring-0 text-[17px] leading-6 placeholder:text-zinc-600"
                                    maxLength={30}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <div className="group border border-zinc-500/50 rounded focus-within:border-primary focus-within:ring-1 focus-within:ring-primary px-3 py-1 bg-transparent transition-colors">
                                <Label htmlFor="website" className="text-zinc-500 text-[13px] group-focus-within:text-primary">Website</Label>
                                <input
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="block w-full bg-transparent border-0 p-0 text-white focus:ring-0 text-[17px] leading-6 placeholder:text-zinc-600"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
