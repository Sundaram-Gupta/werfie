import { useState, useEffect } from "react"
import { notificationService } from "@/services/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, User, Repeat2, MessageCircle, AtSign, Settings, Loader2 } from "lucide-react"
import { BadgeCheck } from "lucide-react"
import { getMediaUrl } from "@/lib/utils"

export default function Notifications() {
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
                    <h1 className="text-[20px] font-bold">Notifications</h1>
                    <Settings className="w-5 h-5 cursor-pointer hover:bg-muted/50 rounded-full transition" />
                </div>
                <div className="flex border-b border-border/50">
                    <div
                        onClick={() => handleTabChange('all')}
                        className={`flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] ${activeTab === 'all' ? 'font-bold' : 'font-medium text-muted-foreground'} relative`}
                    >
                        All
                        {activeTab === 'all' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />}
                    </div>
                    <div
                        onClick={() => handleTabChange('verified')}
                        className={`flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] ${activeTab === 'verified' ? 'font-bold' : 'font-medium text-muted-foreground'} relative`}
                    >
                        Verified
                        {activeTab === 'verified' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />}
                    </div>
                    <div
                        onClick={() => handleTabChange('mentions')}
                        className={`flex-1 p-4 hover:bg-muted/50 transition cursor-pointer text-center text-[15px] ${activeTab === 'mentions' ? 'font-bold' : 'font-medium text-muted-foreground'} relative`}
                    >
                        Mentions
                        {activeTab === 'mentions' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />}
                    </div>
                </div>
            </div>

            <div className="divide-y divide-border/50">
                {loading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No notifications yet</div>
                ) : (
                    notifications.map((notification) => (
                        <div key={notification.id} className="p-4 flex gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer">
                            {/* Icon based on type */}
                            <div className="w-10 flex justify-end">
                                {notification.type === 'like' && <Heart className="w-8 h-8 text-pink-500 fill-current" />}
                                {notification.type === 'repost' && <Repeat2 className="w-8 h-8 text-green-500" />}
                                {notification.type === 'follow' && <User className="w-8 h-8 text-blue-500 fill-current" />}
                                {notification.type === 'reply' && <MessageCircle className="w-8 h-8 text-blue-500 fill-current" />}
                                {notification.type === 'mention' && <AtSign className="w-8 h-8 text-green-500" />}
                            </div>

                            <div className="flex-1 space-y-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={getMediaUrl(notification.actor?.profile?.avatar || notification.actor?.avatar)} />
                                    <AvatarFallback>{notification.actor?.profile?.name?.[0] || notification.actor?.name?.[0]}</AvatarFallback>
                                </Avatar>

                                <div className="text-[15px] leading-5">
                                    <span className="font-bold">{notification.actor?.profile?.name || notification.actor?.name}</span>
                                    {notification.actor?.profile?.isVerified && <BadgeCheck className="inline-block w-4 h-4 text-blue-500 ml-1 mb-0.5 fill-blue-500/10" />}
                                    <span className="text-foreground ml-1">
                                        {notification.type === 'like' && 'liked your post'}
                                        {notification.type === 'repost' && 'reposted your post'}
                                        {notification.type === 'follow' && 'followed you'}
                                        {notification.type === 'reply' && 'replied to your post'}
                                        {notification.type === 'mention' && 'mentioned you'}
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
