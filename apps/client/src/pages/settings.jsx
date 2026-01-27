import { useState, useEffect } from "react"
import { SETTINGS_DATA } from "@/lib/dummy-data"
import { ArrowLeft, ChevronRight, User, Lock, Shield, Bell, Eye, Database, HelpCircle, ExternalLink, X, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { authService } from "@/services/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Settings() {
    const navigate = useNavigate()
    const { user } = useAuth()

    // Preferences State (persisted in localStorage)
    const [notifications, setNotifications] = useState({
        push: true,
        email: true,
        sms: false
    })
    const [display, setDisplay] = useState({
        darkMode: true
    })

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Load saved settings on mount
    useEffect(() => {
        const savedNotifs = localStorage.getItem("settings_notifications")
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs))

        const savedDisplay = localStorage.getItem("settings_display")
        if (savedDisplay) {
            setDisplay(JSON.parse(savedDisplay))
        } else {
            // Default to dark
            document.documentElement.classList.add('dark')
        }
    }, [])

    // Apply Dark Mode effect
    useEffect(() => {
        if (display.darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem("settings_display", JSON.stringify(display))
    }, [display])

    const handleNotifChange = (key, value) => {
        const newNotifs = { ...notifications, [key]: value }
        setNotifications(newNotifs)
        localStorage.setItem("settings_notifications", JSON.stringify(newNotifs))
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (passwordForm.new !== passwordForm.confirm) {
            setError("New passwords do not match")
            return
        }
        setLoading(true)
        setError("")
        setSuccess("")
        try {
            await authService.changePassword(passwordForm.current, passwordForm.new)
            setSuccess("Password updated successfully")
            setTimeout(() => {
                setIsPasswordModalOpen(false)
                setPasswordForm({ current: "", new: "", confirm: "" })
                setSuccess("")
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold leading-6">Settings and privacy</h1>
                    <span className="text-[13px] text-muted-foreground">@{user?.profile?.handle || "user"}</span>
                </div>
            </div>

            <div className="pb-20">
                {/* 1. Account */}
                <SectionHeader title="Account" icon={User} />
                <SettingsItem
                    label="Username"
                    value={`@${user?.profile?.handle || ""}`}
                />
                <SettingsItem
                    label="Email"
                    value={user?.email}
                />
                <SettingsItem
                    label="Change your password"
                    description="Update your password at any time."
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    onClick={() => setIsPasswordModalOpen(true)}
                />
                <SettingsItem
                    label="Deactivate your account"
                    description="Find out how you can deactivate your account."
                    isDestructive
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 2. Privacy and Safety (Mock) */}
                <SectionHeader title="Privacy and Safety" icon={Lock} />
                <SettingsItem
                    label="Audience and tagging"
                    description="Manage what information you allow other people on X to see."
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                />
                <SettingsItem
                    label="Mute and block"
                    description="Manage the accounts, words, and notifications that you’ve muted or blocked."
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 3. Display */}
                <SectionHeader title="Display" icon={Eye} />
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">Dark mode</div>
                        <div className="text-[13px] text-muted-foreground">Adjust the appearance of X.</div>
                    </div>
                    <Switch checked={display.darkMode} onCheckedChange={(c) => setDisplay({ ...display, darkMode: c })} />
                </div>

                <Separator className="my-2 opacity-50" />

                {/* 4. Notifications */}
                <SectionHeader title="Notifications" icon={Bell} />
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">Push notifications</div>
                        <div className="text-[13px] text-muted-foreground">Get push notifications to find out what's going on when you're not on X.</div>
                    </div>
                    <Switch checked={notifications.push} onCheckedChange={(c) => handleNotifChange('push', c)} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">Email notifications</div>
                    </div>
                    <Switch checked={notifications.email} onCheckedChange={(c) => handleNotifChange('email', c)} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">SMS notifications</div>
                    </div>
                    <Switch checked={notifications.sms} onCheckedChange={(c) => handleNotifChange('sms', c)} />
                </div>

                <Separator className="my-2 opacity-50" />

                {/* 5. Data Usage (Mock) */}
                <SectionHeader title="Data Usage" icon={Database} />
                <SettingsItem
                    label="Data saver"
                    description="Reduce data usage by loading lower quality images and videos."
                    action={<Switch />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 6. Security and account access (Mock) */}
                <SectionHeader title="Security and account access" icon={Shield} />
                <SettingsItem
                    label="Security"
                    description="Manage your account's security."
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 7. Help */}
                <SectionHeader title="Additional Resources" icon={HelpCircle} />
                <LinkItem label="Help Center" />
                <div className="px-4 py-6 text-center text-muted-foreground text-[13px]">
                    Version 1.0.0
                </div>
            </div>

            {/* Change Password Modal */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-black text-white border-border">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                        {error && <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{error}</div>}
                        {success && <div className="text-green-500 text-sm bg-green-500/10 p-2 rounded">{success}</div>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Current Password</label>
                            <Input
                                type="password"
                                value={passwordForm.current}
                                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <Input
                                type="password"
                                value={passwordForm.new}
                                onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <Input
                                type="password"
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 rounded-full" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SectionHeader({ title, icon: Icon }) {
    return (
        <div className="px-4 py-3 flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
            <h2 className="font-bold text-[19px]">{title}</h2>
        </div>
    )
}

function SettingsItem({ label, description, value, action, isDestructive, onClick }) {
    return (
        <div onClick={onClick} className="px-4 py-3 hover:bg-white/[0.03] transition cursor-pointer flex items-center justify-between group">
            <div className="flex-1 pr-4">
                <div className={`font-medium text-[15px] ${isDestructive ? 'text-red-500' : ''}`}>{label}</div>
                {description && <div className="text-[13px] text-muted-foreground leading-4 mt-0.5">{description}</div>}
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-[13px] text-muted-foreground">{value}</span>}
                {action}
            </div>
        </div>
    )
}

function LinkItem({ label }) {
    return (
        <div className="px-4 py-3 hover:bg-white/[0.03] transition cursor-pointer flex items-center justify-between">
            <div className="font-medium text-[15px]">{label}</div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </div>
    )
}
