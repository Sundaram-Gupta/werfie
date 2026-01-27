import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Users,
    FileText,
    AlertTriangle,
    MessageSquare,
    Megaphone,
    BarChart,
    Settings,
    ChevronLeft,
    Sun,
    Moon,
    Monitor,
    Shield,
    Globe,
    ShoppingBag,
    Briefcase,
    TrendingUp,
    Truck,
    Calendar,
    Mail,
    Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

// Werfie Admin Navigation Structure
const navGroups = [
    {
        title: "OVERVIEW",
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: BarChart, label: 'Analytics', href: '/analytics' },
        ]
    },
    {
        title: "COMMUNITY",
        items: [
            { icon: Users, label: 'Users', href: '/users' },
            { icon: MessageSquare, label: 'Posts', href: '/posts' },
            { icon: Users, label: 'Communities', href: '/communities' },
        ]
    },
    {
        title: "MODERATION",
        items: [
            { icon: Shield, label: 'Reports', href: '/reports', badge: 12 },
            { icon: AlertTriangle, label: 'Appeals', href: '/appeals' },
        ]
    },
    {
        title: "BUSINESS",
        items: [
            { icon: Megaphone, label: 'Ads Manager', href: '/ads' },
            { icon: Briefcase, label: 'Verification', href: '/verification' },
        ]
    },
    {
        title: "SYSTEM",
        items: [
            { icon: Settings, label: 'Settings', href: '/settings' },
            { icon: Globe, label: 'Global Config', href: '/config' },
        ]
    }
];

// Helper for Activity icon which wasn't in original import
import { Activity } from 'lucide-react';

export function Sidebar({ className }) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "dark";
        setTheme(savedTheme);
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, []);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
    };

    return (
        <div className={cn("pb-4 min-h-screen flex flex-col transition-all duration-300 bg-[#0a0a0b] border-r border-white/5", collapsed ? "w-20" : "w-[280px]", className)}>
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 mb-2">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div className="flex items-center justify-center">
                            <img src="/websplash.png" alt="Logo" className="w-8 h-8 object-contain dark:invert" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Werfie Admin</h2>
                    </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground" onClick={() => setCollapsed(!collapsed)}>
                    <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
                </Button>
            </div >

            {/* Navigation */}
            < div className="flex-1 overflow-y-auto py-2 px-4 space-y-8 scrollbar-hide" >
                {
                    navGroups.map((group, idx) => (
                        <div key={idx}>
                            {!collapsed && (
                                <h3 className="mb-3 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.href;
                                    return (
                                        <Button
                                            key={item.href}
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-start h-10 mb-1 rounded-full transition-all duration-200 group relative",
                                                collapsed ? "justify-center px-0" : "px-4",
                                                isActive
                                                    ? "bg-white/10 text-white"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                            asChild
                                        >
                                            <Link to={item.href}>
                                                <item.icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-white" : "text-gray-400 group-hover:text-white", !collapsed && "mr-3")} />
                                                {!collapsed && (
                                                    <div className="flex-1 flex items-center justify-between">
                                                        <span className="font-medium text-[13px]">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        {item.hasSubmenu && (
                                                            <ChevronLeft className="h-3 w-3 rotate-180 opacity-50" />
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                }
            </div >

            {/* Bottom Section: Theme Switcher */}
            {
                !collapsed && (
                    <div className="p-4 mt-auto">
                        <div className="bg-[#151516] border border-white/5 rounded-full p-1 flex items-center relative">
                            <div
                                className="absolute bg-[#2a2a2c] rounded-full h-[calc(100%-8px)] top-1 transition-all duration-300 ease-out shadow-sm border border-white/5"
                                style={{
                                    width: '31%',
                                    left: theme === 'light' ? '4px' : theme === 'dark' ? 'calc(50% - 15.5%)' : 'calc(100% - 31% - 4px)'
                                }}
                            />

                            <button
                                onClick={() => handleThemeChange('light')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors duration-200", theme === 'light' ? "text-white" : "text-gray-500 hover:text-gray-300")}
                            >
                                <Sun className="h-3.5 w-3.5" /> Light
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors duration-200", theme === 'dark' ? "text-white" : "text-gray-500 hover:text-gray-300")}
                            >
                                <Moon className="h-3.5 w-3.5" /> Dark
                            </button>
                            <button
                                onClick={() => handleThemeChange('system')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors duration-200", theme === 'system' ? "text-white" : "text-gray-500 hover:text-gray-300")}
                            >
                                <Monitor className="h-3.5 w-3.5" /> System
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

