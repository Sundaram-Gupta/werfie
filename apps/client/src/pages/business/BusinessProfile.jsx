import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Building, MapPin, Globe, Mail, Clock, ShieldCheck, Upload } from "lucide-react"
import { businessService, userService, mediaService } from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { getMediaUrl } from "@/lib/utils"

export default function BusinessProfile() {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        email: "",
        website: "",
        location: "",
        hours: ""
    })
    const [verificationStatus, setVerificationStatus] = useState("idle")
    const [isVerified, setIsVerified] = useState(false)
    const [requestingVerification, setRequestingVerification] = useState(false)
    const [logoUrl, setLogoUrl] = useState("")
    const [bannerUrl, setBannerUrl] = useState("")
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)

    const logoInputRef = useRef(null)
    const bannerInputRef = useRef(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await businessService.getProfile()
                if (data) {
                    setFormData({
                        companyName: data.companyName || "",
                        industry: data.industry || "",
                        email: data.email || "",
                        website: data.website || "",
                        location: data.location || "",
                        hours: data.hours || ""
                    })
                    setVerificationStatus(data.status || "idle")
                    setIsVerified(data.isVerified || false)
                }
            } catch (err) {
                console.error('Failed to fetch business profile:', err)
                // 404 is expected if profile doesn't exist yet
            } finally {
                setFetching(false)
            }
        }
        fetchProfile()
    }, [])

    useEffect(() => {
        if (!user) return
        setLogoUrl(user.profile?.avatar || user.avatar || "")
        setBannerUrl(user.profile?.banner || user.banner || "")
    }, [user])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImageUpload = async (file, type) => {
        if (!file) return
        if (!file.type?.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        if (type === "logo") setUploadingLogo(true)
        if (type === "banner") setUploadingBanner(true)

        try {
            const result = await mediaService.uploadMedia(file)
            // Robust extraction: media service might return { status, data: { url } } or { url }
            const uploadedUrl = result?.data?.url || result?.url || result?.mediaUrl
            
            if (!uploadedUrl) throw new Error("Upload succeeded but URL missing")
            
            if (type === "logo") setLogoUrl(uploadedUrl)
            if (type === "banner") setBannerUrl(uploadedUrl)
            toast.success(type === "logo" ? "Logo uploaded" : "Banner uploaded")
        } catch (err) {
            console.error("Image upload failed:", err)
            toast.error("Failed to upload image")
        } finally {
            if (type === "logo") setUploadingLogo(false)
            if (type === "banner") setUploadingBanner(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Only send fields that the backend actually supports.
            const businessPayload = {
                companyName: (formData.companyName || "").trim(),
                industry: formData.industry?.trim() || undefined,
                location: formData.location?.trim() || undefined,
                website: formData.website?.trim() || undefined
            }

            await businessService.updateProfile(businessPayload)

            // Persist branding (logo/banner) to the user's public Profile.
            if (user?.id) {
                await userService.updateProfile(user.id, {
                    avatarUrl: logoUrl || undefined,
                    bannerUrl: bannerUrl || undefined
                })
            }

            toast.success("Business profile saved successfully!")

            // Refresh UI from backend so previews stay in sync.
            try {
                const refreshed = await businessService.getProfile()
                if (refreshed) {
                    setFormData({
                        companyName: refreshed.companyName || "",
                        industry: refreshed.industry || "",
                        email: refreshed.email || "",
                        website: refreshed.website || "",
                        location: refreshed.location || "",
                        hours: refreshed.hours || ""
                    })
                    setVerificationStatus(refreshed.status || "idle")
                    setIsVerified(refreshed.isVerified || false)
                }
                if (user?.id) {
                    const me = await userService.getMyProfile()
                    if (me) updateUser(me)
                }
                // eslint-disable-next-line no-empty
            } catch (_) {}
        } catch (err) {
            console.error('Failed to save business profile:', err)
            toast.error(err.response?.data?.error || "Failed to save business profile")
        } finally {
            setLoading(false)
        }
    }

    const handleRequestVerification = async () => {
        if (!formData.companyName) {
            toast.error("Please set a business name before requesting verification")
            return
        }
        setRequestingVerification(true)
        try {
            const res = await businessService.requestVerification()
            toast.success("Verification request submitted successfully!")
            if (res.profile) {
                setVerificationStatus(res.profile.status)
            }
        } catch (err) {
            console.error('Failed to request verification:', err)
            toast.error(err.response?.data?.error || "Failed to request verification")
        } finally {
            setRequestingVerification(false)
        }
    }

    if (fetching) {
        return <div className="flex items-center justify-center p-20 text-muted-foreground">Loading business profile...</div>
    }

    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}>
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Business Profile</h2>
                        <p className="text-sm text-muted-foreground">Manage your public business information</p>
                    </div>
                    <Button
                        className="rounded-full bg-blue-500 text-white"
                        disabled={loading || uploadingLogo || uploadingBanner}
                        type="submit"
                    >
                        {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                    </Button>
                </div>

                <div className="space-y-6">
                {/* Verification Status */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-blue-500">Business Verification</div>
                             <div className="text-xs text-blue-300">
                                {isVerified ? "Your business is verified." : 
                                 (verificationStatus?.toLowerCase() === "pending" || verificationStatus?.toLowerCase() === "under_review") ? 
                                 "Your verification request is under review." : 
                                 "Unlock advanced features and build trust."}
                            </div>
                        </div>
                    </div>
                    {isVerified ? (
                        <Button disabled variant="outline" size="sm" className="bg-green-500/10 border-green-500/30 text-green-500">
                            Verified
                        </Button>
                    ) : (verificationStatus?.toLowerCase() === "pending" || verificationStatus?.toLowerCase() === "under_review") ? (
                        <Button disabled variant="outline" size="sm" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-500">
                            Pending Review
                        </Button>
                    ) : (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRequestVerification}
                            disabled={requestingVerification || uploadingLogo || uploadingBanner || loading}
                            className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400"
                        >
                            {requestingVerification ? "Requesting..." : "Request Verification"}
                        </Button>
                    )}
                </div>

                {/* Main Form */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" /> Business Name
                        </label>
                        <Input name="companyName" value={formData.companyName} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Acme Corp" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry</label>
                            <Input name="industry" value={formData.industry} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Technology" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" /> Public Email
                            </label>
                            <Input name="email" value={formData.email} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="contact@acme.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" /> Website
                        </label>
                        <Input name="website" value={formData.website} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="https://acme.com" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" /> Location
                        </label>
                        <Input name="location" value={formData.location} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Silicon Valley, CA" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" /> Business Hours
                        </label>
                        <Input name="hours" value={formData.hours} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Mon-Fri: 9AM - 5PM" />
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6">
                    <h3 className="font-bold mb-4">Branding</h3>
                    <div className="flex gap-4">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => logoInputRef.current?.click()}
                            onKeyDown={(e) => e.key === "Enter" && logoInputRef.current?.click()}
                            className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border border-dashed border-muted-foreground/50 hover:border-primary cursor-pointer transition-colors overflow-hidden"
                        >
                            {logoUrl ? (
                                <img src={getMediaUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Logo</span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                void handleImageUpload(file, "logo")
                                // allow re-uploading the same file
                                e.target.value = ""
                            }}
                        />
                        <div className="flex-1 h-24 bg-zinc-800 rounded-xl flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 hover:border-primary cursor-pointer transition-colors">
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => bannerInputRef.current?.click()}
                                onKeyDown={(e) => e.key === "Enter" && bannerInputRef.current?.click()}
                                className="w-full h-full flex items-center justify-center"
                            >
                                {bannerUrl ? (
                                    <img src={getMediaUrl(bannerUrl)} alt="Banner" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground">Banner Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                void handleImageUpload(file, "banner")
                                e.target.value = ""
                            }}
                        />
                    </div>
                </div>
            </div>
            </form>
        </div>
    )
}
