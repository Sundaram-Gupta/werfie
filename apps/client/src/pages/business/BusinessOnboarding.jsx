import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Check, ChevronRight, Building2, ImageIcon, ShieldCheck, Users } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { useBusinessAccess } from "@/context/BusinessAccessContext"
import { businessService, userService, mediaService } from "@/services/api"
import { cn } from "@/lib/utils"

const STEPS = [
    { n: 1, label: "Business", icon: Building2 },
    { n: 2, label: "Profile", icon: ImageIcon },
    { n: 3, label: "Verification", icon: ShieldCheck },
    { n: 4, label: "Team", icon: Users },
]

export default function BusinessOnboarding() {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const { access, loading: accessLoading, refreshAccess } = useBusinessAccess()
    const userId = user?.id || user?._id

    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)

    const [companyName, setCompanyName] = useState("")
    const [handle, setHandle] = useState("")
    const [bio, setBio] = useState(user?.profile?.bio || "")
    const [website, setWebsite] = useState(user?.profile?.website || "")
    const [invite, setInvite] = useState("")

    useEffect(() => {
        if (accessLoading) return
        if (access?.role === "member") {
            navigate("/business/dashboard", { replace: true })
            return
        }
        if (access?.isOwner && access?.onboardingCompleted) {
            navigate("/business/dashboard", { replace: true })
        }
    }, [accessLoading, access?.role, access?.isOwner, access?.onboardingCompleted, navigate])

    useEffect(() => {
        if (!accessLoading && access?.hasBusiness) {
            setStep((s) => Math.max(s, 2))
        }
    }, [access?.hasBusiness, accessLoading])

    useEffect(() => {
        if (user?.profile) {
            setBio(user.profile.bio || "")
            setWebsite(user.profile.website || "")
        }
    }, [user?.profile])

    const goNext = () => setStep((s) => Math.min(4, s + 1))

    const handleCreateBusiness = async (e) => {
        e.preventDefault()
        if (!companyName.trim() || !handle.trim()) {
            toast.error("Enter a business name and handle")
            return
        }
        setSaving(true)
        try {
            await businessService.createBusiness({ companyName: companyName.trim(), handle: handle.trim() })
            await refreshAccess()
            try {
                const full = await userService.getMyProfile()
                if (full) updateUser(full)
            } catch {
                /* non-fatal */
            }
            toast.success("Business created")
            goNext()
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not create business")
        } finally {
            setSaving(false)
        }
    }

    const handleProfileStep = async (e) => {
        e.preventDefault()
        if (!userId) {
            toast.error("Missing user")
            return
        }
        setSaving(true)
        try {
            const logoInput = document.getElementById("ob-logo")
            const bannerInput = document.getElementById("ob-banner")
            let avatarUrl = user?.profile?.avatar
            let bannerUrl = user?.profile?.banner

            if (logoInput?.files?.[0]) {
                const r = await mediaService.uploadMedia(logoInput.files[0])
                avatarUrl = r?.data?.url || r?.url
            }
            if (bannerInput?.files?.[0]) {
                const r = await mediaService.uploadMedia(bannerInput.files[0])
                bannerUrl = r?.data?.url || r?.url
            }

            await userService.updateProfile(userId, {
                bio: bio || undefined,
                website: website || undefined,
                ...(avatarUrl ? { avatar: avatarUrl } : {}),
                ...(bannerUrl ? { banner: bannerUrl } : {}),
            })
            await businessService.updateProfile({
                website: website || undefined,
            })
            try {
                const full = await userService.getMyProfile()
                if (full) updateUser(full)
            } catch {
                /* ignore */
            }
            toast.success("Profile updated")
            goNext()
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not save profile")
        } finally {
            setSaving(false)
        }
    }

    const handleVerification = async (request) => {
        if (!request) {
            goNext()
            return
        }
        setSaving(true)
        try {
            await businessService.requestVerification()
            toast.success("Verification submitted")
            goNext()
        } catch (err) {
            toast.error(err.response?.data?.error || "Verification request failed")
        } finally {
            setSaving(false)
        }
    }

    const handleFinish = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            if (invite.trim()) {
                await businessService.inviteTeamMember(invite.trim(), "member")
                toast.success("Invitation sent")
            }
            await businessService.completeOnboarding()
            await refreshAccess()
            toast.success("You’re all set")
            navigate("/business/dashboard", { replace: true })
        } catch (err) {
            toast.error(err.response?.data?.error || "Could not finish onboarding")
        } finally {
            setSaving(false)
        }
    }

    if (accessLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-foreground">
            <div className="max-w-lg mx-auto px-4 py-10">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-[rgb(29,155,240)] mb-2">
                    Business onboarding
                </p>
                <h1 className="text-2xl font-bold mb-6">Set up your professional presence</h1>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {STEPS.map(({ n, label, icon: Icon }) => (
                        <div
                            key={n}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shrink-0 border",
                                step >= n ? "bg-white text-black border-white" : "border-white/15 text-muted-foreground"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                            {step > n && <Check className="w-3 h-3" />}
                        </div>
                    ))}
                </div>

                {step === 1 && !access?.hasBusiness && (
                    <form onSubmit={handleCreateBusiness} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Business name</label>
                            <Input
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="mt-1 bg-white/[0.05] border-white/15"
                                placeholder="Acme Inc."
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Handle</label>
                            <Input
                                value={handle}
                                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30))}
                                className="mt-1 bg-white/[0.05] border-white/15"
                                placeholder="acme_inc"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">This updates your @handle on Werfie.</p>
                        </div>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-full bg-[rgb(29,155,240)] text-white font-bold"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>}
                        </Button>
                    </form>
                )}

                {step === 1 && access?.hasBusiness && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">You already have a business. Continue to profile setup.</p>
                        <Button className="w-full rounded-full font-bold" onClick={() => setStep(2)}>
                            Continue <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleProfileStep} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Bio / description</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="mt-1 w-full min-h-[88px] rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-sm"
                                placeholder="What does your business do?"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Website</label>
                            <Input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="mt-1 bg-white/[0.05] border-white/15"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium">Logo</label>
                                <input id="ob-logo" type="file" accept="image/*" className="mt-1 text-xs w-full" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Banner</label>
                                <input id="ob-banner" type="file" accept="image/*" className="mt-1 text-xs w-full" />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-full bg-[rgb(29,155,240)] text-white font-bold"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue</>}
                        </Button>
                    </form>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Optional: submit your business for verification. You can also do this later from Profile.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full border-white/20"
                                disabled={saving}
                                onClick={() => handleVerification(false)}
                            >
                                Skip for now
                            </Button>
                            <Button
                                type="button"
                                className="rounded-full bg-white text-black font-bold"
                                disabled={saving}
                                onClick={() => handleVerification(true)}
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request verification"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <form onSubmit={handleFinish} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Optional: invite a teammate by email or @handle. You are assigned as admin.
                        </p>
                        <div>
                            <label className="text-sm font-medium">Invite (optional)</label>
                            <Input
                                value={invite}
                                onChange={(e) => setInvite(e.target.value)}
                                className="mt-1 bg-white/[0.05] border-white/15"
                                placeholder="colleague@company.com or @handle"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-full bg-[rgb(29,155,240)] text-white font-bold"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish & go to dashboard"}
                        </Button>
                    </form>
                )}

                <Button variant="ghost" className="mt-8 w-full text-muted-foreground" type="button" onClick={() => navigate("/")}>
                    Cancel and back to Werfie
                </Button>
            </div>
        </div>
    )
}
