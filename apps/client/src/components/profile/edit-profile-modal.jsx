import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef } from "react"
import { userService, mediaService } from "@/services/api"
import { X, Camera, Loader2, ChevronRight } from "lucide-react"
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
        handle: user.profile?.handle || user.handle || "",
        bio: user.profile?.bio || "",
        location: user.profile?.location || "",
        website: user.profile?.website || "",
        banner: user.profile?.banner || user.banner || "",
        avatar: user.profile?.avatar || user.avatar || "",
        gender: user.profile?.gender || "",
        birthdate: user.profile?.birthdate ? new Date(user.profile.birthdate).toISOString().slice(0, 10) : "",
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

        try {
            if (!user.id) throw new Error("User ID is missing");
            const updated = await userService.updateProfile(user.id, formData)
            console.log("Profile updated successfully:", updated);
            
            // Call onUpdate to sync local state without refresh
            if (onUpdate) onUpdate(updated)
            
            setOpen(false)
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
            <DialogContent className="sm:max-w-[600px] bg-black border-zinc-800 p-0 overflow-hidden text-white gap-0 top-[50%] translate-y-[-50%] sm:rounded-2xl border">
                <DialogHeader className="px-4 py-3 flex flex-row items-center justify-between border-b border-zinc-800/50 sticky top-0 z-20 bg-black/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-full p-2 hover:bg-zinc-800/50 transition -ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <DialogTitle className="text-[20px] font-bold">Edit Profile</DialogTitle>
                        <DialogDescription className="sr-only">Update your profile name, bio, and photos</DialogDescription>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || uploadingBanner || uploadingAvatar}
                        className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-5 h-[34px] text-[15px] transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                </DialogHeader>

                <div className="p-0 overflow-y-auto max-h-[80vh] scrollbar-hide">
                    {/* Banner Upload */}
                    <div className="h-[200px] bg-zinc-900 relative group overflow-hidden">
                        {formData.banner ? (
                            <img src={getMediaUrl(formData.banner)} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                        ) : (
                            <div className="w-full h-full bg-zinc-800/50" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center gap-4">
                            <button
                                onClick={() => bannerInputRef.current?.click()}
                                className="p-3 bg-black/40 rounded-full hover:bg-black/60 transition-all backdrop-blur-md border border-white/10 group-hover:scale-110"
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
                    <div className="relative px-4 -mt-[3.5rem] mb-6">
                        <div className="w-[112px] h-[112px] rounded-full border-4 border-black bg-zinc-900 relative group overflow-hidden shadow-2xl">
                            {formData.avatar ? (
                                <img src={getMediaUrl(formData.avatar)} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <Camera className="w-8 h-8 text-zinc-500" />
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="p-3 bg-black/40 rounded-full hover:bg-black/60 transition-all backdrop-blur-md border border-white/10 group-hover:scale-110"
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

                    <div className="p-4 pt-0 space-y-6 pb-12">
                        {/* Custom Input Style Component */}
                        <div className="space-y-6">
                            <ProfileInput 
                                label="Name" 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                maxLength={50} 
                            />

                            <ProfileInput
                                label="Handle"
                                id="handle"
                                name="handle"
                                value={formData.handle}
                                onChange={handleChange}
                                maxLength={30}
                                placeholder="latesth13"
                            />

                            <ProfileTextarea 
                                label="Bio" 
                                id="bio" 
                                name="bio" 
                                value={formData.bio} 
                                onChange={handleChange} 
                                maxLength={160} 
                            />

                            <ProfileInput 
                                label="Location" 
                                id="location" 
                                name="location" 
                                value={formData.location} 
                                onChange={handleChange} 
                                maxLength={30} 
                            />

                            <ProfileInput 
                                label="Website" 
                                id="website" 
                                name="website" 
                                value={formData.website} 
                                onChange={handleChange} 
                                maxLength={100} 
                                placeholder="example.com"
                            />

                            {/* Gender Select */}
                            <div className="relative group">
                                <div className="border border-zinc-800 rounded-lg bg-transparent p-3 pt-6 relative focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all duration-200">
                                    <Label className="absolute left-3 top-2 text-zinc-500 text-[13px] group-focus-within:text-primary font-medium tracking-wide">Gender</Label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-none p-0 text-white focus:ring-0 text-[17px] appearance-none cursor-pointer outline-none relative z-10"
                                    >
                                        <option value="" className="bg-zinc-900">Select gender</option>
                                        <option value="male" className="bg-zinc-900">Male</option>
                                        <option value="female" className="bg-zinc-900">Female</option>
                                        <option value="non_binary" className="bg-zinc-900">Non-binary</option>
                                        <option value="other" className="bg-zinc-900">Other</option>
                                        <option value="prefer_not_to_say" className="bg-zinc-900">Prefer not to say</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-focus-within:text-primary transition-colors">
                                        <ChevronRight className="w-5 h-5 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <ProfileInput 
                                label="Birth date" 
                                id="birthdate" 
                                name="birthdate" 
                                type="date"
                                value={formData.birthdate} 
                                onChange={handleChange} 
                                className="[color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ProfileInput({ label, id, name, value, onChange, maxLength, type = "text", placeholder, className }) {
    return (
        <div className="relative group">
            <div className="border border-zinc-800 rounded-lg bg-transparent p-3 pt-6 relative focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all duration-200">
                <Label htmlFor={id} className="absolute left-3 top-2 text-zinc-500 text-[13px] group-focus-within:text-primary font-medium tracking-wide uppercase transition-colors">{label}</Label>
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={cn(
                        "block w-full bg-transparent border-0 p-0 text-white focus:ring-0 text-[17px] placeholder:text-zinc-700 outline-none",
                        className
                    )}
                    maxLength={maxLength}
                />
                {maxLength && (
                    <div className="absolute right-3 top-2 text-zinc-600 text-[11px] font-mono hidden group-focus-within:block opacity-60">
                        {value?.length}/{maxLength}
                    </div>
                )}
            </div>
        </div>
    )
}

function ProfileTextarea({ label, id, name, value, onChange, maxLength }) {
    return (
        <div className="relative group">
            <div className="border border-zinc-800 rounded-lg bg-transparent p-3 pt-6 relative focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all duration-200">
                <Label htmlFor={id} className="absolute left-3 top-2 text-zinc-500 text-[13px] group-focus-within:text-primary font-medium tracking-wide uppercase transition-colors">{label}</Label>
                <Textarea
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="block w-full bg-transparent border-0 p-0 text-white focus:ring-0 text-[17px] leading-6 resize-none min-h-[85px] scrollbar-hide outline-none"
                    maxLength={maxLength}
                />
                {maxLength && (
                    <div className="absolute right-3 top-2 text-zinc-600 text-[11px] font-mono hidden group-focus-within:block opacity-60">
                        {value?.length}/{maxLength}
                    </div>
                )}
            </div>
        </div>
    )
}
