import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react"
import { settingsService } from "@/services/api"
import { toast } from "sonner"

export default function AudienceTaggingSettings() {
    const navigate = useNavigate()
    const [protectPosts, setProtectPosts] = useState(false)
    const [protectVideos, setProtectVideos] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsService.getSettings()
                const privacy = data?.privacy ?? {}
                setProtectPosts(!!privacy.protectPosts)
                setProtectVideos(!!privacy.protectVideos)
            } catch (err) {
                console.error("Failed to fetch settings:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const updatePrivacy = async (field, value) => {
        const prevPosts = protectPosts
        const prevVideos = protectVideos
        const newPosts = field === 'protectPosts' ? !!value : prevPosts
        const newVideos = field === 'protectVideos' ? !!value : prevVideos
        setProtectPosts(newPosts)
        setProtectVideos(newVideos)
        setSaving(true)
        try {
            await settingsService.updateSettings({
                privacy: { protectPosts: newPosts, protectVideos: newVideos }
            })
            toast.success("Settings saved")
        } catch (err) {
            console.error("Failed to save settings:", err)
            toast.error("Failed to save settings")
            setProtectPosts(prevPosts)
            setProtectVideos(prevVideos)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold leading-6">Audience, media and tagging</h1>
                    <p className="text-[13px] text-muted-foreground">Manage what information you allow other people on X to see.</p>
                </div>
            </div>

            <div className="divide-y divide-border/50 pb-20">
                {/* Protect your posts */}
                <div className="px-4 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px]">Protect your posts</div>
                        <p className="text-[13px] text-muted-foreground mt-1">
                            When selected, your posts and other account information are only visible to people who follow you.
                        </p>
                        <a href="#" className="text-[13px] text-primary hover:underline mt-1 inline-block">Learn more</a>
                    </div>
                    <input
                        type="checkbox"
                        checked={protectPosts}
                        onChange={(e) => updatePrivacy('protectPosts', e.target.checked)}
                        disabled={saving}
                        className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20 mt-1 cursor-pointer flex-shrink-0 disabled:opacity-50"
                    />
                </div>

                {/* Protect your videos */}
                <div className="px-4 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px]">Protect your videos</div>
                        <p className="text-[13px] text-muted-foreground mt-1">
                            If selected, videos in your posts will not be downloadable by default. This setting applies to posts going forward and is not retroactive.
                        </p>
                        <a href="#" className="text-[13px] text-primary hover:underline mt-1 inline-block">Learn more</a>
                    </div>
                    <input
                        type="checkbox"
                        checked={protectVideos}
                        onChange={(e) => updatePrivacy('protectVideos', e.target.checked)}
                        disabled={saving}
                        className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-2 focus:ring-primary/20 mt-1 cursor-pointer flex-shrink-0 disabled:opacity-50"
                    />
                </div>

                {/* Photo tagging */}
                <div
                    onClick={() => navigate('/settings/photo-tagging')}
                    className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer"
                >
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px]">Photo tagging</div>
                        <p className="text-[13px] text-muted-foreground mt-1">Anyone can tag you.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
            </div>
        </div>
    )
}
