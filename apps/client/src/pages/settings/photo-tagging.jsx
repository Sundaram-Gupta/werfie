import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { settingsService } from "@/services/api"
import { toast } from "sonner"

export default function PhotoTaggingSettings() {
    const navigate = useNavigate()
    const [photoTaggingEnabled, setPhotoTaggingEnabled] = useState(true)
    const [taggingPermission, setTaggingPermission] = useState("anyone") // "anyone" | "followed"
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsService.getSettings()
                const privacy = data?.privacy ?? {}
                setPhotoTaggingEnabled(privacy.photoTaggingEnabled !== false)
                setTaggingPermission(privacy.taggingPermission || "anyone")
            } catch (err) {
                console.error("Failed to fetch settings:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const updatePhotoTagging = async (value) => {
        const prev = photoTaggingEnabled
        setPhotoTaggingEnabled(value)
        setSaving(true)
        try {
            await settingsService.updateSettings({
                privacy: { photoTaggingEnabled: value }
            })
            toast.success("Settings saved")
        } catch (err) {
            console.error("Failed to save settings:", err)
            toast.error("Failed to save settings")
            setPhotoTaggingEnabled(prev)
        } finally {
            setSaving(false)
        }
    }

    const updateTaggingPermission = async (value) => {
        const prev = taggingPermission
        setTaggingPermission(value)
        setSaving(true)
        try {
            await settingsService.updateSettings({
                privacy: { taggingPermission: value }
            })
            toast.success("Settings saved")
        } catch (err) {
            console.error("Failed to save settings:", err)
            toast.error("Failed to save settings")
            setTaggingPermission(prev)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
        )
    }

    return (
        <div>
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <h1 className="text-[20px] font-bold leading-6">Photo tagging</h1>
            </div>

            <div className="divide-y divide-border/50 pb-20">
                {/* Photo tagging toggle */}
                <div className="px-4 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px]">Photo tagging</div>
                        <p className="text-[13px] text-muted-foreground mt-1">
                            Allow people to tag you in their photos and receive notifications when they do so.
                        </p>
                    </div>
                    <Switch
                        checked={photoTaggingEnabled}
                        onCheckedChange={updatePhotoTagging}
                        disabled={saving}
                        className="flex-shrink-0 mt-0.5"
                    />
                </div>

                {/* Tagging permission options */}
                <div className="py-2">
                    <div
                        onClick={() => !saving && updateTaggingPermission("anyone")}
                        className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer"
                    >
                        <span className="text-[15px]">Anyone can tag you</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${taggingPermission === "anyone" ? "border-primary bg-primary" : "border-muted-foreground bg-transparent"}`}>
                            {taggingPermission === "anyone" && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                        </div>
                    </div>
                    <div
                        onClick={() => !saving && updateTaggingPermission("followed")}
                        className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer"
                    >
                        <span className="text-[15px]">Only people you follow can tag you</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${taggingPermission === "followed" ? "border-primary bg-primary" : "border-muted-foreground bg-transparent"}`}>
                            {taggingPermission === "followed" && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
