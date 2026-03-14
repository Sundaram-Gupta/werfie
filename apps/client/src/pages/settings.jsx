import { useState, useEffect } from "react"
import { SETTINGS_DATA } from "@/lib/dummy-data"
import { ArrowLeft, ChevronRight, User, Lock, Shield, Bell, Eye, Database, HelpCircle, ExternalLink, X, Loader2, Globe } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { authService, userService, settingsService } from "@/services/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useTranslation } from 'react-i18next'

export default function Settings() {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const { t, i18n } = useTranslation()

    const changeLanguage = async (lng) => {
        i18n.changeLanguage(lng)
        if (user?.id) {
            try {
                updateUser({ preferredLanguage: lng })
                await userService.updateProfile(user.id, { preferredLanguage: lng })
            } catch (error) {
                console.error("Failed to update language preference", error)
            }
        }
    }

    // Preferences State (from API, fallback to localStorage when unauthenticated)
    const [notifications, setNotifications] = useState({
        push: true,
        email: true,
        sms: false
    })
    const [display, setDisplay] = useState({
        darkMode: true
    })
    const [settingsLoading, setSettingsLoading] = useState(true)

    // Password Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Load saved settings on mount (API first, fallback to localStorage)
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await settingsService.getSettings()
                if (data?.notifications) {
                    setNotifications(prev => ({
                        push: data.notifications.push !== false,
                        email: data.notifications.email !== false,
                        sms: !!data.notifications.sms
                    }))
                }
                if (data?.display?.darkMode !== undefined) {
                    setDisplay({ darkMode: data.display.darkMode })
                } else if (data?.theme === 'dark' || data?.theme === 'light') {
                    setDisplay({ darkMode: data.theme === 'dark' })
                }
            } catch (err) {
                const savedNotifs = localStorage.getItem("settings_notifications")
                if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
                const savedDisplay = localStorage.getItem("settings_display")
                if (savedDisplay) setDisplay(JSON.parse(savedDisplay))
            } finally {
                setSettingsLoading(false)
            }
        }
        loadSettings()
    }, [])

    // Apply Dark Mode effect
    useEffect(() => {
        if (display.darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [display])

    const handleNotifChange = async (key, value) => {
        const newNotifs = { ...notifications, [key]: value }
        setNotifications(newNotifs)
        try {
            await settingsService.updateSettings({
                notifications: { ...notifications, [key]: value }
            })
        } catch (err) {
            setNotifications(notifications)
        }
    }

    const handleDisplayChange = async (key, value) => {
        const newDisplay = { ...display, [key]: value }
        setDisplay(newDisplay)
        try {
            await settingsService.updateSettings({ display: newDisplay })
        } catch (err) {
            setDisplay(display)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (passwordForm.new !== passwordForm.confirm) {
            setError(t('settings_page.new_pass_error'))
            return
        }
        setLoading(true)
        setError("")
        setSuccess("")
        try {
            await authService.changePassword(passwordForm.current, passwordForm.new)
            setSuccess(t('settings_page.pass_update_success'))
            setTimeout(() => {
                setIsPasswordModalOpen(false)
                setPasswordForm({ current: "", new: "", confirm: "" })
                setSuccess("")
            }, 2000)
        } catch (err) {
            setError(err.response?.data?.error || t('settings_page.pass_update_error'))
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
                    <h1 className="text-[20px] font-bold leading-6">{t('settings')}</h1>
                    <span className="text-[13px] text-muted-foreground">@{user?.profile?.handle || "user"}</span>
                </div>
            </div>

            <div className="pb-20">
                {/* 1. Account */}
                {/* 1. Account */}
                <SectionHeader title={t('account')} icon={User} />
                <SettingsItem
                    label={t('settings_page.username')}
                    value={`@${user?.profile?.handle || ""}`}
                />
                <SettingsItem
                    label={t('settings_page.email')}
                    value={user?.email}
                />
                <SettingsItem
                    label={t('settings_page.change_password')}
                    description={t('settings_page.change_password_desc')}
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    onClick={() => setIsPasswordModalOpen(true)}
                />
                <SettingsItem
                    label="Institutional Account"
                    description="Manage your institutional presence and verification"
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    onClick={() => navigate('/settings/institutional')}
                />
                <SettingsItem
                    label={t('settings_page.deactivate_account')}
                    description={t('settings_page.deactivate_account_desc')}
                    isDestructive
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 2. Privacy and Safety (Mock) */}
                {/* 2. Privacy and Safety (Mock) */}
                <SectionHeader title={t('privacy_safety')} icon={Lock} />
                <SettingsItem
                    label={t('settings_page.audience_tagging')}
                    description={t('settings_page.audience_tagging_desc')}
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    onClick={() => navigate('/settings/audience-and-tagging')}
                />
                <SettingsItem
                    label={t('settings_page.mute_block')}
                    description={t('settings_page.mute_block_desc')}
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    onClick={() => navigate('/settings/mute-and-block')}
                />

                <Separator className="my-2 opacity-50" />

                {/* 3. Display */}
                <SectionHeader title={t('display')} icon={Eye} />
                
                {/* Language Selection */}
                 <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">{t('language')}</div>
                        <div className="text-[13px] text-muted-foreground">{t('select_language')}</div>
                    </div>
                    <select 
                        className="bg-black text-white border border-gray-700 rounded-md p-1 text-sm focus:outline-none focus:border-blue-500"
                        value={i18n.language}
                        onChange={(e) => changeLanguage(e.target.value)}
                    >
                        <option value="en">English (US)</option>
                        <option value="hi">Hindi (हिंदी)</option>
                        <option value="es">Spanish (Español)</option>
                        <option value="fr">French (Français)</option>
                        <option value="de">German (Deutsch)</option>
                    </select>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">{t('dark_mode')}</div>
                        <div className="text-[13px] text-muted-foreground">{t('settings_page.display_desc')}</div>
                    </div>
                    <Switch checked={display.darkMode} onCheckedChange={(c) => handleDisplayChange('darkMode', c)} disabled={settingsLoading} />
                </div>

                <Separator className="my-2 opacity-50" />

                {/* 4. Notifications */}
                <SectionHeader title={t('notifications')} icon={Bell} />
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">{t('settings_page.notifications_push')}</div>
                        <div className="text-[13px] text-muted-foreground">{t('settings_page.notifications_push_desc')}</div>
                    </div>
                    <Switch checked={notifications.push} onCheckedChange={(c) => handleNotifChange('push', c)} disabled={settingsLoading} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">{t('settings_page.notifications_email')}</div>
                    </div>
                    <Switch checked={notifications.email} onCheckedChange={(c) => handleNotifChange('email', c)} disabled={settingsLoading} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 pr-4">
                        <div className="font-medium text-[15px]">{t('settings_page.notifications_sms')}</div>
                    </div>
                    <Switch checked={notifications.sms} onCheckedChange={(c) => handleNotifChange('sms', c)} disabled={settingsLoading} />
                </div>

                <Separator className="my-2 opacity-50" />

                {/* 5. Data Usage (Mock) */}
                <SectionHeader title={t('settings_page.data_usage')} icon={Database} />
                <SettingsItem
                    label={t('settings_page.data_saver')}
                    description={t('settings_page.data_saver_desc')}
                    action={<Switch />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 6. Security and account access (Mock) */}
                <SectionHeader title={t('settings_page.security_access')} icon={Shield} />
                <SettingsItem
                    label={t('settings_page.security')}
                    description={t('settings_page.security_desc')}
                    action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
                />

                <Separator className="my-2 opacity-50" />

                {/* 7. Help */}
                <SectionHeader title={t('settings_page.additional_resources')} icon={HelpCircle} />
                <LinkItem label={t('settings_page.help_center')} />
                <div className="px-4 py-6 text-center text-muted-foreground text-[13px]">
                    Version 1.0.0
                </div>
            </div>

            {/* Change Password Modal */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-black text-white border-border">
                    <DialogHeader>
                        <DialogTitle>{t('settings_page.change_password_title')}</DialogTitle>
                        <DialogDescription className="sr-only">Enter your current password and new password</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleChangePassword} className="space-y-4 pt-4">
                        {error && <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded">{error}</div>}
                        {success && <div className="text-green-500 text-sm bg-green-500/10 p-2 rounded">{success}</div>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('settings_page.current_password')}</label>
                            <Input
                                type="password"
                                value={passwordForm.current}
                                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('settings_page.new_password')}</label>
                            <Input
                                type="password"
                                value={passwordForm.new}
                                onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('settings_page.confirm_new_password')}</label>
                            <Input
                                type="password"
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                className="bg-[#202327] border-none"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>{t('cancel')}</Button>
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 rounded-full" disabled={loading}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {t('save')}
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
