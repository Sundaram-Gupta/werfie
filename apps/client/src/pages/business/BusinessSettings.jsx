import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Shield, Globe, ChevronRight, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

const STORAGE_KEY = "business_settings"

const defaultSettings = {
    emailNotifications: true,
    teamInviteNotifications: true,
    analyticsWeekly: true,
    profilePublic: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
}

export default function BusinessSettings({ onSwitchTab }) {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [settings, setSettings] = useState(defaultSettings)

    useEffect(() => {
        const load = async () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY)
                if (stored) {
                    const parsed = JSON.parse(stored)
                    setSettings((s) => ({ ...s, ...parsed }))
                }
            } catch {
                // use defaults
            } finally {
                setFetching(false)
            }
        }
        load()
    }, [])

    const handleChange = (key, value) => {
        const next = { ...settings, [key]: value }
        setSettings(next)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        toast.success("Setting saved")
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
            toast.success("Settings saved")
        } catch (err) {
            toast.error("Failed to save settings")
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return (
            <div className="flex justify-center items-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Manage your business account preferences</p>
                <Button className="rounded-full bg-blue-500 text-white" onClick={handleSave} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
                </Button>
            </div>

            {/* Notifications */}
            <div className="bg-zinc-900/50 border border-border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    Notifications
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Email notifications</p>
                            <p className="text-xs text-muted-foreground">Receive business updates and alerts by email</p>
                        </div>
                        <Switch checked={settings.emailNotifications} onCheckedChange={(v) => handleChange("emailNotifications", v)} />
                    </div>
                    <Separator className="bg-border/50" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Team invites</p>
                            <p className="text-xs text-muted-foreground">Get notified when someone invites you to a team</p>
                        </div>
                        <Switch checked={settings.teamInviteNotifications} onCheckedChange={(v) => handleChange("teamInviteNotifications", v)} />
                    </div>
                    <Separator className="bg-border/50" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Weekly analytics</p>
                            <p className="text-xs text-muted-foreground">Receive a weekly summary of your business performance</p>
                        </div>
                        <Switch checked={settings.analyticsWeekly} onCheckedChange={(v) => handleChange("analyticsWeekly", v)} />
                    </div>
                </div>
            </div>

            {/* Visibility */}
            <div className="bg-zinc-900/50 border border-border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    Visibility
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-sm">Public profile</p>
                        <p className="text-xs text-muted-foreground">Allow others to find and view your business profile</p>
                    </div>
                    <Switch checked={settings.profilePublic} onCheckedChange={(v) => handleChange("profilePublic", v)} />
                </div>
            </div>

            {/* Regional */}
            <div className="bg-zinc-900/50 border border-border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    Regional
                </h3>
                <div>
                    <label className="text-sm font-medium block mb-2">Timezone</label>
                    <Input
                        value={settings.timezone}
                        onChange={(e) => {
                            const next = { ...settings, timezone: e.target.value }
                            setSettings(next)
                            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
                        }}
                        className="bg-black/50 border-border"
                        placeholder="e.g. America/New_York"
                    />
                </div>
            </div>

            {/* Quick actions */}
            <div className="bg-zinc-900/50 border border-border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">Quick actions</h3>
                <div className="space-y-2">
                    <button
                        onClick={() => onSwitchTab?.("profile")}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                    >
                        <span className="text-sm font-medium">Edit business profile</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => onSwitchTab?.("team")}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
                    >
                        <span className="text-sm font-medium">Manage team members</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    )
}
