import { useState, useEffect } from "react"
import { notificationService } from "@/services/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Users, Repeat2, MessageSquare, MessageCircle, AtSign, Settings, Loader2 } from "lucide-react"
import { BadgeCheck } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

import { useTranslation } from "react-i18next"

export default function Notifications() {
    const { t } = useTranslation()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all') // 'all', 'verified', 'mentions'

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true)
            try {
                const params = {}
                if (activeTab === 'verified') params.filter = 'verified'
                if (activeTab === 'mentions') params.filter = 'mentions'

                const data = await notificationService.getNotifications(params)
                setNotifications(data)
            } catch (error) {
                console.error("Failed to load notifications", error)
            } finally {
                setLoading(false)
            }
        }
        fetchNotifications()
    }, [activeTab])

    const handleTabChange = (tab) => {
        setActiveTab(tab)
    }

    return (
        <div>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="text-[20px] font-bold">{t('notifications.title')}</h1>
                    <Settings className="w-5 h-5 cursor-pointer hover:bg-muted/50 rounded-full transition" />
                </div>
                <div className="flex border-b border-border/50">
                    <div
                        onClick={() => handleTabChange('all')}
                        className={`flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] ${activeTab === 'all' ? 'font-bold' : 'font-medium text-muted-foreground'} relative`}
                    >
                        {t('notifications.tabs.all')}
                        {activeTab === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />}
                    </div>
                    <div
                        onClick={() => handleTabChange('verified')}
                        className={`flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] ${activeTab === 'verified' ? 'font-bold' : 'font-medium text-muted-foreground'} relative`}
                    >
                        {t('notifications.tabs.verified')}
                        {activeTab === 'verified' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />}
                    </div>
                    <div
                        onClick={() => handleTabChange('mentions')}
                        className={`flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] ${activeTab === 'mentions' ? 'font-bold' : 'font-medium text-muted-foreground'} relative`}
                    >
                        {t('notifications.tabs.mentions')}
                        {activeTab === 'mentions' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />}
                    </div>
                </div>
            </div>

            <div className="divide-y divide-border/50">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">{t('notifications.empty')}</div>
                ) : (
                    notifications.map((notification) => (
                        <div key={notification.id} className="p-4 flex gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer">
                            {/* Icon based on type */}
                            <div className="w-10 flex justify-end">
                                {notification.type === 'like' && <Heart className="w-8 h-8 text-pink-500 fill-current" />}
                                {(notification.type === 'repost' || notification.type === 'retweet') && <Repeat2 className="w-8 h-8 text-green-500" />}
                                {notification.type === 'follow' && <Users className="w-8 h-8 text-sky-500" />}
                                {notification.type === 'reply' && <MessageSquare className="w-8 h-8 text-violet-500" />}
                                {notification.type === 'mention' && <AtSign className="w-8 h-8 text-green-500" />}
                                {notification.type === 'message' && <MessageCircle className="w-8 h-8 text-primary fill-current" />}
                            </div>

                            <div className="flex-1 space-y-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={getMediaUrl(notification.actor?.profile?.avatar || notification.actor?.avatar)} />
                                    <AvatarFallback>{notification.actor?.profile?.name?.[0] || notification.actor?.name?.[0]}</AvatarFallback>
                                </Avatar>

                                <div className="text-[15px] leading-5">
                                    <span className="font-bold">{notification.actor?.name || t('notifications.unknown_user')}</span>
                                    {notification.actor?.profile?.verified && <BadgeCheck className="inline-block w-4 h-4 text-blue-500 ml-1 mb-0.5 fill-blue-500/10" />}
                                    <span className="text-foreground ml-1">

                                        {notification.type === 'like' && t('notifications.types.like')}
                                        {(notification.type === 'repost' || notification.type === 'retweet') && t('notifications.types.repost')}
                                        {notification.type === 'follow' && t('notifications.types.follow')}
                                        {notification.type === 'reply' && t('notifications.types.reply')}
                                        {notification.type === 'mention' && t('notifications.types.mention')}
                                        {notification.type === 'message' && t('notifications.types.message')}
                                    </span>
                                </div>

                                {notification.post && (
                                    <p className="text-[15px] text-muted-foreground leading-5">
                                        {notification.post.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
