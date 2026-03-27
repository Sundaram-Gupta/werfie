import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { createSocketWithRecovery } from '@/lib/socketWithRecovery';
import { getGatewayUrl } from '@/lib/api';
import { useAdminStore } from '@/store/admin.store';
import { ADMIN_NAV_ITEMS } from '@/config/admin.config';

export default function AdminLayout() {
    const [messages, setMessages] = useState([]);
    const [openCenter, setOpenCenter] = useState(false);
    const pushNotification = useAdminStore((s) => s.pushNotification);
    const notifications = useAdminStore((s) => s.notifications);
    const clearNotifications = useAdminStore((s) => s.clearNotifications);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const socket = createSocketWithRecovery(`${getGatewayUrl()}/crisis-live`, { auth: { token } });
        const add = (text) => {
            setMessages((prev) => [text, ...prev].slice(0, 5));
            pushNotification(text);
        };
        socket.on('crisis.alert', (c) => add(`New crisis alert: ${c?.title || 'unknown'}`));
        socket.on('crisis.updated', (c) => add(`Severity/status updated: ${c?.title || c?.id || 'crisis'}`));
        socket.on('crisis.stream_started', (p) => add(`Stream started for crisis ${p?.crisisId || 'unknown'}`));
        return () => socket.disconnect();
    }, [pushNotification]);

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-4">
                        <Link to="/crisis-command" className="text-sm text-slate-400 hover:text-white">Back to Command</Link>
                        <h1 className="text-lg font-bold">Admin Control Panel</h1>
                    </div>
                    <nav className="flex items-center gap-2 text-sm">
                        {ADMIN_NAV_ITEMS.map((item) => (
                            <NavLink key={item.path} to={item.path} end={item.end} className={({ isActive }) => `rounded px-3 py-1.5 ${isActive ? 'bg-white text-black' : 'text-slate-300 hover:bg-white/10'}`}>
                                {item.label}
                            </NavLink>
                        ))}
                        <button onClick={() => setOpenCenter((v) => !v)} className="relative rounded px-3 py-1.5 text-slate-300 hover:bg-white/10">
                            <Bell className="h-4 w-4" />
                            {notifications.length > 0 && (
                                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                    {notifications.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>
                <div className="border-t border-white/5 px-4 py-2 text-xs text-amber-200">
                    <div className="mx-auto flex max-w-7xl items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>{messages[0] || 'Admin notifications active - waiting for events'}</span>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-6">
                <Outlet />
            </main>
            {openCenter && (
                <aside className="fixed right-4 top-24 z-40 w-96 rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Notification Center</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={clearNotifications} className="text-xs text-slate-300 hover:text-white">Clear</button>
                            <button onClick={() => setOpenCenter(false)} className="text-slate-300 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                        {notifications.length === 0 && (
                            <p className="text-xs text-slate-400">No notifications yet.</p>
                        )}
                        {notifications.map((n) => (
                            <div key={n.id} className="rounded border border-white/10 bg-black/40 px-3 py-2">
                                <p className="text-sm">{n.text}</p>
                                <p className="mt-1 text-[10px] text-slate-500">{new Date(n.ts).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </aside>
            )}
        </div>
    );
}
