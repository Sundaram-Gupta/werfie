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
    Inbox,
    Server,
    ChevronDown,
    Mic,
    Image
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
            { icon: Globe, label: 'World Leaders', href: '/world-leaders' },
            { icon: MessageSquare, label: 'Posts', href: '/posts' },
            { icon: Users, label: 'Communities', href: '/communities' },
            { icon: Mic, label: 'Spaces', href: '/spaces' },
        ]
    },
    {
        title: "MODERATION",
        items: [
            {
                icon: AlertTriangle,
                label: 'Reports',
                badge: 12,
                subItems: [
                    { label: 'Manage Reports', href: '/reports' },
                    { label: 'Manage Users Reports', href: '/reports/users' }
                ]
            },
            { icon: Shield, label: 'Appeals', href: '/appeals' },
            { icon: MessageSquare, label: 'Messaging', href: '/messaging' },
            { icon: Image, label: 'Media', href: '/media' },
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
            { icon: Globe, label: 'Platform Config', href: '/config' },
            { icon: FileText, label: 'System Logs', href: '/logs' },
        ]
    }
];

// Helper for Activity icon which wasn't in original import
import { Activity } from 'lucide-react';

export function Sidebar({ className }) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [theme, setTheme] = useState("dark");
    const [openSubmenus, setOpenSubmenus] = useState({});

    const toggleSubmenu = (label) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

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
        <div className={cn("pb-4 min-h-screen flex flex-col transition-all duration-300 bg-card border-r border-border", collapsed ? "w-20" : "w-[280px]", className)}>
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 mb-2">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div className="flex items-center justify-center">
                            <img src="/websplash.png" alt="Logo" className="w-8 h-8 object-contain dark:invert-0 invert" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Werfie Admin</h2>
                    </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto rounded-full hover:bg-accent hover:text-accent-foreground text-muted-foreground" onClick={() => setCollapsed(!collapsed)}>
                    <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
                </Button>
            </div >

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-4 space-y-8 scrollbar-hide">
                {navGroups.map((group, idx) => (
                    <div key={idx}>
                        {!collapsed && (
                            <h3 className="mb-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {group.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isSubmenuOpen = openSubmenus[item.label];
                                const hasSubItems = item.subItems && item.subItems.length > 0;
                                const isActive = location.pathname === item.href || (hasSubItems && item.subItems.some(sub => location.pathname === sub.href));

                                if (hasSubItems) {
                                    return (
                                        <div key={item.label} className="mb-1">
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start h-10 rounded-full transition-all duration-200 group relative",
                                                    collapsed ? "justify-center px-0" : "px-4",
                                                    isActive ? "bg-accent text-accent-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                )}
                                                onClick={() => !collapsed && toggleSubmenu(item.label)}
                                            >
                                                <item.icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground", !collapsed && "mr-3")} />
                                                {!collapsed && (
                                                    <div className="flex-1 flex items-center justify-between">
                                                        <span className="text-[13px]">{item.label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {item.badge && (
                                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200 opacity-50", isSubmenuOpen && "rotate-180")} />
                                                        </div>
                                                    </div>
                                                )}
                                            </Button>
                                            
                                            {/* Submenu Items */}
                                            {!collapsed && isSubmenuOpen && (
                                                <div className="mt-1 ml-4 pl-4 border-l border-border space-y-1">
                                                    {item.subItems.map((subItem) => {
                                                        const isSubActive = location.pathname === subItem.href;
                                                        return (
                                                            <Button
                                                                key={subItem.href}
                                                                variant="ghost"
                                                                className={cn(
                                                                    "w-full justify-start h-9 rounded-md transition-all duration-200 px-4",
                                                                    isSubActive
                                                                        ? "bg-accent/50 text-foreground font-medium"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                                asChild
                                                            >
                                                                <Link to={subItem.href}>
                                                                    <span className="text-[12px]">{subItem.label}</span>
                                                                </Link>
                                                            </Button>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <Button
                                        key={item.href}
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start h-10 mb-1 rounded-full transition-all duration-200 group relative",
                                            collapsed ? "justify-center px-0" : "px-4",
                                            isActive
                                                ? "bg-accent text-accent-foreground shadow-sm font-semibold"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        )}
                                        asChild
                                    >
                                        <Link to={item.href}>
                                            <item.icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground", !collapsed && "mr-3")} />
                                            {!collapsed && (
                                                <div className="flex-1 flex items-center justify-between">
                                                    <span className="text-[13px]">{item.label}</span>
                                                    {item.badge && (
                                                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </Link>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section: Theme Switcher */}
            {
                !collapsed && (
                    <div className="p-4 mt-auto">
                        <div className="bg-muted/50 border border-border rounded-full p-1 flex items-center relative">
                            <div
                                className="absolute bg-background rounded-full h-[calc(100%-8px)] top-1 transition-all duration-300 ease-out shadow-sm border border-border"
                                style={{
                                    width: '31%',
                                    left: theme === 'light' ? '4px' : theme === 'dark' ? 'calc(50% - 15.5%)' : 'calc(100% - 31% - 4px)'
                                }}
                            />

                            <button
                                onClick={() => handleThemeChange('light')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors duration-200", theme === 'light' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                <Sun className="h-3.5 w-3.5" /> Light
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors duration-200", theme === 'dark' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                            >
                                <Moon className="h-3.5 w-3.5" /> Dark
                            </button>
                            <button
                                onClick={() => handleThemeChange('system')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium z-10 transition-colors duration-200", theme === 'system' ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
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

