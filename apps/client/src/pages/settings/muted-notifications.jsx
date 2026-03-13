import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { settingsService } from "@/services/api"
import { toast } from "sonner"

const OPTIONS = [
    { id: "dontFollow", label: "You don't follow" },
    { id: "dontFollowYou", label: "Who don't follow you" },
    { id: "newAccount", label: "With a new account" },
    { id: "defaultPhoto", label: "Who have a default profile photo" },
    { id: "unconfirmedEmail", label: "Who haven't confirmed their email" },
    { id: "unconfirmedPhone", label: "Who haven't confirmed their phone number" },
]

export default function MutedNotificationsSettings() {
    const navigate = useNavigate()
    const [filters, setFilters] = useState({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await settingsService.getSettings()
                const muted = data?.notifications?.mutedFilters ?? {}
                setFilters(OPTIONS.reduce((acc, o) => ({ ...acc, [o.id]: !!muted[o.id] }), {}))
            } catch (err) {
                console.error("Failed to fetch settings:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const toggleFilter = async (id, value) => {
        const prev = { ...filters }
        setFilters((f) => ({ ...f, [id]: value }))
        setSaving(true)
        try {
            const mutedFilters = { ...filters, [id]: value }
            await settingsService.updateSettings({
                notifications: { mutedFilters }
            })
            toast.success("Settings saved")
        } catch (err) {
            console.error("Failed to save settings:", err)
            toast.error("Failed to save settings")
            setFilters(prev)
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
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition -ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <h1 className="text-[20px] font-bold leading-6">Muted notifications</h1>
            </div>

            <div className="px-4 py-6 pb-20">
                <h2 className="text-[20px] font-bold text-foreground mb-4">Mute notifications from people:</h2>

                <div className="divide-y divide-border/50">
                    {OPTIONS.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => !saving && toggleFilter(opt.id, !filters[opt.id])}
                            className="py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer"
                        >
                            <span className="text-[15px] text-foreground">{opt.label}</span>
                            <input
                                type="checkbox"
                                checked={!!filters[opt.id]}
                                onChange={(e) => toggleFilter(opt.id, e.target.checked)}
                                disabled={saving}
                                className="w-5 h-5 rounded-sm border-border bg-background text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50 flex-shrink-0"
                            />
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-[15px] text-muted-foreground">
                    These filters won't affect notifications from people you follow.{" "}
                    <a href="#" className="text-primary hover:underline">Learn more</a>
                </p>
            </div>
        </div>
    )
}
