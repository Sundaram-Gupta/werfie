import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Pencil, Building, MapPin, Globe, Mail, Clock, ShieldCheck, Upload } from "lucide-react"
import { businessService, userService, mediaService } from "@/services/api"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { useBusinessAccess } from "@/context/BusinessAccessContext"
import { getMediaUrl, cn } from "@/lib/utils"

/** Merge GET/POST business profile into form state without wiping fields the API omits (e.g. email/hours). */
function mergeBusinessFormFromApi(apiData, prevForm, userEmailFallback = "") {
    if (!apiData || typeof apiData !== "object") return prevForm
    return {
        companyName: apiData.companyName ?? prevForm.companyName ?? "",
        industry: apiData.industry ?? prevForm.industry ?? "",
        email: apiData.email ?? prevForm.email ?? userEmailFallback,
        website: apiData.website ?? prevForm.website ?? "",
        location: apiData.location ?? prevForm.location ?? "",
        hours: apiData.hours ?? prevForm.hours ?? ""
    }
}

export default function BusinessProfile() {
    const { user, updateUser } = useAuth()
    const { access } = useBusinessAccess()
    const readOnly = access?.role === "member"
    const [isEditing, setIsEditing] = useState(false)
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
                    setFormData((prev) =>
                        mergeBusinessFormFromApi(data, prev, user?.email || "")
                    )
                    setVerificationStatus(data.status || "idle")
                    setIsVerified(data.isVerified || false)
                    setLogoUrl(data.logoUrl || access?.businessLogoUrl || access?.ownerAvatar || "")
                    setBannerUrl(data.bannerUrl || access?.businessBannerUrl || access?.ownerBanner || "")
                }
            } catch (err) {
                console.error('Failed to fetch business profile:', err)
                // 404 is expected if profile doesn't exist yet
            } finally {
                setFetching(false)
            }
        }
        fetchProfile()
    }, [access?.businessLogoUrl, access?.businessBannerUrl, access?.ownerAvatar, access?.ownerBanner, user?.email])

    useEffect(() => {
        if (!user) return
        // Members should see workspace branding (owner/business), not their personal profile media.
        if (readOnly) {
            setLogoUrl((prev) => prev || access?.businessLogoUrl || access?.ownerAvatar || "")
            setBannerUrl((prev) => prev || access?.businessBannerUrl || access?.ownerBanner || "")
            return
        }
        setLogoUrl((prev) => prev || user.profile?.avatar || user.avatar || "")
        setBannerUrl((prev) => prev || user.profile?.banner || user.banner || "")
    }, [user, readOnly, access?.businessLogoUrl, access?.businessBannerUrl, access?.ownerAvatar, access?.ownerBanner])

    const fieldsLocked = readOnly || !isEditing

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleCancelEdit = async () => {
        setIsEditing(false)
        try {
            const data = await businessService.getProfile()
            if (data) {
                setFormData((prev) => mergeBusinessFormFromApi(data, prev, user?.email || ""))
                setVerificationStatus(data.status || "idle")
                setIsVerified(data.isVerified || false)
                setLogoUrl(data.logoUrl || access?.businessLogoUrl || access?.ownerAvatar || "")
                setBannerUrl(data.bannerUrl || access?.businessBannerUrl || access?.ownerBanner || "")
            }
        } catch (err) {
            console.error("Failed to reload business profile:", err)
        }
    }

    const handleImageUpload = async (file, type) => {
        if (fieldsLocked) return
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
        if (readOnly || !isEditing) return
        setLoading(true)
        try {
            // Only send fields that the backend actually supports.
            const businessPayload = {
                companyName: (formData.companyName || "").trim(),
                industry: formData.industry?.trim() || undefined,
                location: formData.location?.trim() || undefined,
                website: formData.website?.trim() || undefined
            }

            const updated = await businessService.updateProfile(businessPayload)

            // Persist branding (logo/banner) to the user's public Profile.
            if (user?.id) {
                await userService.updateProfile(user.id, {
                    avatarUrl: logoUrl || undefined,
                    bannerUrl: bannerUrl || undefined
                })
            }

            toast.success("Business profile saved successfully!")
            setIsEditing(false)

            // Apply saved row immediately so the UI reflects persisted fields without waiting on a second round-trip.
            if (updated && typeof updated === "object") {
                setFormData((prev) => mergeBusinessFormFromApi(updated, prev, user?.email || ""))
                setVerificationStatus(updated.status || "idle")
                setIsVerified(!!updated.isVerified)
            }

            // Refresh from backend and merge (keeps email/hours if still not stored server-side).
            try {
                const refreshed = await businessService.getProfile()
                if (refreshed) {
                    setFormData((prev) => mergeBusinessFormFromApi(refreshed, prev, user?.email || ""))
                    setVerificationStatus(refreshed.status || "idle")
                    setIsVerified(!!refreshed.isVerified)
                }
                if (user?.id) {
                    const me = await userService.getMyProfile()
                    if (me) {
                        updateUser(me)
                        const av = me.profile?.avatar || me.avatar
                        const bn = me.profile?.banner || me.banner
                        if (av) setLogoUrl(av)
                        if (bn) setBannerUrl(bn)
                    }
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
        if (readOnly) return
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
                        <p className="text-sm text-muted-foreground">
                            {readOnly ? "View-only — admins update this page." : "Manage your public business information"}
                        </p>
                    </div>
                    {!readOnly && (
                        isEditing ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    disabled={loading || uploadingLogo || uploadingBanner}
                                    onClick={() => void handleCancelEdit()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="rounded-full bg-blue-500 text-white"
                                    disabled={loading || uploadingLogo || uploadingBanner}
                                    type="submit"
                                >
                                    {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                className="rounded-full bg-blue-500 text-white"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                            </Button>
                        )
                    )}
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
                    ) : readOnly ? (
                        <Button disabled variant="outline" size="sm" className="opacity-60">
                            View only
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

                {/* Main Form — inputs use zinc-900 + autofill overrides in index.css (.dark) */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 space-y-4 business-profile-fields">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" /> Business Name
                        </label>
                        <Input name="companyName" value={formData.companyName} onChange={handleChange} disabled={fieldsLocked} className="bg-zinc-900 border-border text-zinc-100 placeholder:text-zinc-500" placeholder="Acme Corp" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry</label>
                            <Input name="industry" value={formData.industry} onChange={handleChange} disabled={fieldsLocked} className="bg-zinc-900 border-border text-zinc-100 placeholder:text-zinc-500" placeholder="Technology" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" /> Public Email
                            </label>
                            <Input
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={fieldsLocked}
                                className="bg-zinc-900 border-border text-zinc-100 placeholder:text-zinc-500"
                                placeholder="contact@acme.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" /> Website
                        </label>
                        <Input name="website" value={formData.website} onChange={handleChange} disabled={fieldsLocked} className="bg-zinc-900 border-border text-zinc-100 placeholder:text-zinc-500" placeholder="https://acme.com" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" /> Location
                        </label>
                        <Input name="location" value={formData.location} onChange={handleChange} disabled={fieldsLocked} className="bg-zinc-900 border-border text-zinc-100 placeholder:text-zinc-500" placeholder="Silicon Valley, CA" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" /> Business Hours
                        </label>
                        <Input name="hours" value={formData.hours} onChange={handleChange} disabled={fieldsLocked} className="bg-zinc-900 border-border text-zinc-100 placeholder:text-zinc-500" placeholder="Mon-Fri: 9AM - 5PM" />
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6">
                    <h3 className="font-bold mb-4">Branding</h3>
                    <div className="flex gap-4">
                        <div
                            role="button"
                            tabIndex={fieldsLocked ? -1 : 0}
                            onClick={() => !fieldsLocked && logoInputRef.current?.click()}
                            onKeyDown={(e) => e.key === "Enter" && !fieldsLocked && logoInputRef.current?.click()}
                            className={cn(
                                "w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center border border-dashed border-muted-foreground/50 transition-colors overflow-hidden",
                                fieldsLocked ? "opacity-60 cursor-not-allowed" : "hover:border-primary cursor-pointer"
                            )}
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
                        <div
                            className={cn(
                                "flex-1 h-24 bg-zinc-800 rounded-xl flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 transition-colors",
                                fieldsLocked ? "opacity-60 cursor-not-allowed" : "hover:border-primary cursor-pointer"
                            )}
                        >
                            <div
                                role="button"
                                tabIndex={fieldsLocked ? -1 : 0}
                                onClick={() => !fieldsLocked && bannerInputRef.current?.click()}
                                onKeyDown={(e) => e.key === "Enter" && !fieldsLocked && bannerInputRef.current?.click()}
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
