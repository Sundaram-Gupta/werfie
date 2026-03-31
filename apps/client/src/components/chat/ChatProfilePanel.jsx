import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Phone, Video, User, MoreHorizontal, Clock, 
    ShieldX, Ban, Search, BellOff, Trash2, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { messagingService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ChatProfilePanel({ targetUser, onClose, conversationId }) {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { socket } = useSocket();
    
    const [settings, setSettings] = useState({
        isBlocked: false,
        isMuted: false,
        disappearingMode: 'off',
        screenshotBlock: false,
        amIBlocked: false
    });
    const [loading, setLoading] = useState(true);

    // Fetch initial profile/settings
    useEffect(() => {
        if (!targetUser?.id) return;
        
        let mounted = true;
        api.get(`/api/messages/chat/profile/${targetUser.id}`)
            .then(res => {
                if (mounted && res.data?.status) {
                    setSettings(res.data.data.settings);
                }
            })
            .catch(err => console.error("Failed to load chat settings", err))
            .finally(() => { if (mounted) setLoading(false); });

        return () => { mounted = false; };
    }, [targetUser?.id]);

    // Listen for socket events
    useEffect(() => {
        if (!socket || !targetUser?.id) return;

        const handleSettingsUpdated = (data) => {
            const myId = currentUser?.id || currentUser?.userId;
            if (data.targetUserId === targetUser.id || data.targetUserId === myId) {
                setSettings(prev => ({ ...prev, ...data }));
            }
        };

        const handleUserBlocked = (data) => {
            const myId = currentUser?.id || currentUser?.userId;
            if (data.targetUserId === targetUser.id) {
                setSettings(prev => ({ ...prev, isBlocked: data.isBlocked }));
            } else if (data.targetUserId === myId) {
                setSettings(prev => ({ ...prev, amIBlocked: data.isBlocked }));
            }
        };

        socket.on('SETTINGS_UPDATED', handleSettingsUpdated);
        socket.on('USER_BLOCKED', handleUserBlocked);
        socket.on('USER_UNBLOCKED', handleUserBlocked);

        return () => {
            socket.off('SETTINGS_UPDATED', handleSettingsUpdated);
            socket.off('USER_BLOCKED', handleUserBlocked);
            socket.off('USER_UNBLOCKED', handleUserBlocked);
        };
    }, [socket, targetUser?.id, currentUser?.userId]);

    const handleDisappearingChange = async () => {
        const modes = ['off', '24h', '7d'];
        const currentIndex = modes.indexOf(settings.disappearingMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        
        // Optimistic UI update
        const previousMode = settings.disappearingMode;
        setSettings(prev => ({ ...prev, disappearingMode: nextMode }));
        
        try {
            await api.put('/api/messages/chat/disappearing', { targetUserId: targetUser.id, mode: nextMode });
        } catch (error) {
            toast.error("Failed to update disappearing mode");
            setSettings(prev => ({ ...prev, disappearingMode: previousMode }));
        }
    };

    const handleScreenshotToggle = async () => {
        const nextState = !settings.screenshotBlock;
        setSettings(prev => ({ ...prev, screenshotBlock: nextState }));
        
        try {
            await api.put('/api/messages/chat/screenshot-block', { targetUserId: targetUser.id, screenshotBlock: nextState });
        } catch (error) {
            toast.error("Failed to update privacy settings");
            setSettings(prev => ({ ...prev, screenshotBlock: !nextState }));
        }
    };

    const handleMuteToggle = async () => {
        const nextState = !settings.isMuted;
        setSettings(prev => ({ ...prev, isMuted: nextState }));
        try {
            await messagingService.muteChat(targetUser.id, nextState);
            toast.success(nextState ? "Conversation muted" : "Conversation unmuted");
        } catch (error) {
            toast.error("Failed to update mute settings");
            setSettings(prev => ({ ...prev, isMuted: !nextState }));
        }
    };

    const handleBlockToggle = async () => {
        if (settings.isBlocked) {
            try {
                await messagingService.blockUser(targetUser.id, false);
                setSettings(prev => ({ ...prev, isBlocked: false }));
                toast.success("User unblocked");
            } catch (error) {
                toast.error("Failed to unblock user");
            }
        } else {
            if (window.confirm(`Are you sure you want to block ${targetUser.name || 'this user'}? You won't receive messages from them.`)) {
                try {
                    await messagingService.blockUser(targetUser.id, true);
                    setSettings(prev => ({ ...prev, isBlocked: true }));
                    toast.error("User blocked");
                } catch (error) {
                    toast.error("Failed to block user");
                }
            }
        }
    };

    const handleClearConversation = async () => {
        if (!conversationId) return toast.error("Conversation ID missing");
        if (window.confirm("Are you sure you want to clear this conversation? This will hide all current messages for you.")) {
            try {
                await messagingService.clearConversation(conversationId);
                toast.success("Conversation history cleared");
                onClose(); // Close modal after clearing
                // Refreshing chat state might be needed, usually handled by parent or shared state
                window.location.reload(); // Simple way to refresh UI state for now
            } catch (error) {
                toast.error("Failed to clear conversation");
            }
        }
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) return toast.error("Conversation ID missing");
        if (window.confirm("Delete conversation? This will remove it from your chat list.")) {
            try {
                await messagingService.deleteConversation(conversationId);
                toast.success("Conversation deleted");
                onClose();
                window.location.reload(); 
            } catch (error) {
                toast.error("Failed to delete conversation");
            }
        }
    };

    const startCall = async (type) => {
        if (settings.isBlocked || settings.amIBlocked) {
            return toast.error("Cannot call blocked user");
        }
        toast.info(`Starting ${type} call...`);
        try {
            await api.post('/api/messages/chat/call/start', { targetUserId: targetUser.id, callType: type });
        } catch (error) {
            toast.error("Could not reach user");
        }
    };

    if (!targetUser) return null;

    return (
        <div className="flex flex-col h-full max-h-[90vh] bg-black text-white overflow-y-auto relative">
            {/* Header */}
            <div className="sticky top-0 bg-black/95 backdrop-blur z-10 flex items-center p-4 border-b border-border">
                <button 
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors mr-2"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1 font-bold text-lg">Details</div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="flex flex-col pb-20">
                    {/* Profile Banner */}
                    <div className="flex flex-col items-center py-8">
                        {targetUser.avatarUrl || targetUser.profile?.avatarUrl ? (
                            <img src={targetUser.avatarUrl || targetUser.profile?.avatarUrl} alt={targetUser.name} className="w-24 h-24 rounded-full object-cover mb-4" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-4xl font-bold mb-4">
                                {targetUser.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <h2 className="text-xl font-bold">{targetUser.name}</h2>
                        <span className="text-gray-400">@{targetUser.handle}</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-center gap-6 mb-8 px-4">
                        <ActionButton icon={<Phone size={20} />} label="Voice" onClick={() => startCall('voice')} />
                        <ActionButton icon={<Video size={20} />} label="Video" onClick={() => startCall('video')} />
                        <ActionButton icon={<User size={20} />} label="Profile" onClick={() => navigate(`/profile/${targetUser.id}`)} />
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex flex-col items-center gap-2 group">
                                    <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center text-white">
                                        <MoreHorizontal size={20} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">More</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[250px] bg-black border-border shadow-2xl p-2 rounded-2xl">
                                <DropdownMenuItem 
                                    onClick={handleMuteToggle}
                                    className="flex items-center gap-3 p-3 text-[15px] font-semibold rounded-xl focus:bg-white/10 cursor-pointer"
                                >
                                    <BellOff className="w-5 h-5" />
                                    <span>{settings.isMuted ? 'Unmute' : 'Mute'}</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem 
                                    onClick={handleBlockToggle}
                                    className="flex items-center gap-3 p-3 text-[15px] font-semibold rounded-xl focus:bg-white/10 cursor-pointer"
                                >
                                    <Ban className="w-5 h-5" />
                                    <span>{settings.isBlocked ? 'Unblock Messages' : 'Block Messages'}</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                    className="flex items-center gap-3 p-3 text-[15px] font-semibold rounded-xl focus:bg-white/10 cursor-pointer"
                                    onClick={() => toast.info("Search in conversation coming soon")}
                                >
                                    <Search className="w-5 h-5" />
                                    <span>Search</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator className="bg-border my-1" />

                                <DropdownMenuItem 
                                    onClick={handleClearConversation}
                                    className="flex items-center gap-3 p-3 text-[15px] font-semibold text-red-500 rounded-xl focus:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>Clear conversation</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem 
                                    onClick={handleDeleteConversation}
                                    className="flex items-center gap-3 p-3 text-[15px] font-semibold text-red-500 rounded-xl focus:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <span>Delete conversation</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="h-2 w-full bg-border/20" /> {/* Divider */}

                    {/* Privacy Settings */}
                    <div className="flex flex-col px-4 py-2">
                        <SettingsItem 
                            icon={<Clock size={20} />}
                            title="Disappearing Messages"
                            value={settings.disappearingMode === 'off' ? 'Off' : settings.disappearingMode}
                            onClick={handleDisappearingChange}
                        />
                        <SettingsItem 
                            icon={<ShieldX size={20} />}
                            title="Block Screenshots"
                            value={settings.screenshotBlock ? 'On' : 'Off'}
                            onClick={handleScreenshotToggle}
                        />
                    </div>

                    <div className="h-2 w-full bg-border/20" /> {/* Divider */}

                    {/* Danger Zone */}
                    <div className="flex flex-col px-4 py-2 mt-2">
                        <button 
                            onClick={handleBlockToggle}
                            className="flex items-center gap-4 text-red-500 hover:bg-red-500/5 p-4 rounded-xl transition-colors text-left"
                        >
                            <Ban size={20} />
                            <span className="text-lg font-semibold">
                                {settings.isBlocked ? 'Unblock Messages' : 'Block Messages'}
                            </span>
                        </button>
                    </div>

                    {/* Notice */}
                    {(settings.isBlocked || settings.amIBlocked) && (
                        <div className="m-4 p-4 rounded-xl bg-red-950/30 border border-red-900 text-red-400 text-sm">
                            {settings.amIBlocked ? "You cannot send messages to this user." : "You have blocked this user. They cannot send you messages."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ActionButton({ icon, label, onClick }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-2 group">
            <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors flex items-center justify-center text-white">
                {icon}
            </div>
            <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">{label}</span>
        </button>
    );
}

function SettingsItem({ icon, title, value, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
        >
            <div className="flex items-center gap-4 text-gray-200">
                <div className="text-gray-400">{icon}</div>
                <span className="text-[17px] font-medium">{title}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-gray-400">
                <span className="text-[15px]">{value}</span>
                <span className="text-gray-600">{`>`}</span>
            </div>
        </div>
    );
}
