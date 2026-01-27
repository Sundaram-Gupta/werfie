import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Shield, User, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'security',
            title: 'Unusual Login Attempt',
            message: 'A login attempt from a new device (iPhone 15, Tokyo) was blocked.',
            time: '2 mins ago',
            read: false,
        },
        {
            id: 2,
            type: 'report',
            title: 'High Priority Report',
            message: 'User @crypto_bot_99 was flagged by 15 users for spam in "Tech Talk".',
            time: '15 mins ago',
            read: false,
        },
        {
            id: 3,
            type: 'system',
            title: 'System Update Scheduled',
            message: 'Maintenance scheduled for Jan 20, 03:00 AM UTC. Expected downtime: 30 mins.',
            time: '1 hour ago',
            read: false,
        },
        {
            id: 4,
            type: 'user',
            title: 'New Admin Invitation Accepted',
            message: 'Sarah Jenkins has accepted the invitation to join as Moderator.',
            time: '3 hours ago',
            read: true,
        },
        {
            id: 5,
            type: 'report',
            title: 'Content Takedown Appeal',
            message: 'User @artist_joe is appealing a copyright strike on Post #8821.',
            time: '5 hours ago',
            read: true,
        },
        {
            id: 6,
            type: 'security',
            title: 'API Rate Limit Warning',
            message: 'Global API traffic spiked to 85% capacity at 14:00 UTC.',
            time: '1 day ago',
            read: true,
        },
    ]);

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        toast.success("Notification marked as read");
    };

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
    };

    const getIcon = (type) => {
        switch (type) {
            case 'security': return <Shield className="h-5 w-5 text-red-400" />;
            case 'report': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
            case 'system': return <Bell className="h-5 w-5 text-blue-400" />;
            case 'user': return <User className="h-5 w-5 text-green-400" />;
            default: return <Bell className="h-5 w-5 text-gray-400" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        Notifications
                        {unreadCount > 0 && (
                            <Badge className="bg-blue-600 hover:bg-blue-500 text-white border-none">
                                {unreadCount} New
                            </Badge>
                        )}
                    </h1>
                    <p className="text-gray-400 mt-1">Stay updated with system alerts and activities.</p>
                </div>
                <Button onClick={markAllRead} variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark all as read
                </Button>
            </div>

            <Card className="bg-[#151516] border-white/5 shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Alerts</CardTitle>
                    <CardDescription className="text-gray-500">Latest system notifications and reports.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex gap-4 p-4 rounded-xl border transition-all ${notification.read
                                    ? 'bg-transparent border-transparent opacity-70'
                                    : 'bg-[#0a0a0b] border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center border border-white/5 bg-white/5`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                                            {notification.title}
                                        </p>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {notification.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {notification.message}
                                    </p>
                                    {!notification.read && (
                                        <div className="pt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => markAsRead(notification.id)}
                                                className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 -ml-2"
                                            >
                                                Mark as read
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
