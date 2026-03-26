import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, Store, Users, Settings, ArrowLeft, MoreHorizontal, Bell, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import BusinessDashboard from "./BusinessDashboard"
import BusinessProfile from "./BusinessProfile"
import BusinessSettings from "./BusinessSettings"
import TeamManagement from "./TeamManagement"
import ProductManagement from "./ProductManagement"

export default function BusinessLayout() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("dashboard")

    // Mock User Data for Header
    const user = {
        name: "Acme Corp",
        handle: "@acmecorp",
        avatar: "AC"
    }

    const tabs = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "products", label: "Products", icon: ShoppingBag },
        { id: "profile", label: "Profile", icon: Store },
        { id: "team", label: "Team", icon: Users },
        { id: "settings", label: "Settings", icon: Settings },
    ]

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard": return <BusinessDashboard />
            case "products": return <ProductManagement />
            case "profile": return <BusinessProfile />
            case "team": return <TeamManagement />
            case "settings": return <BusinessSettings onSwitchTab={setActiveTab} />
            default: return <BusinessDashboard />
        }
    }

    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
            {/* Sidebar Navigation (Desktop) */}
            <aside className="w-64 border-r border-border sticky top-0 h-screen hidden md:flex flex-col bg-black">
                <div className="p-4 border-b border-border/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">W</div>
                        <span className="font-bold text-xl tracking-tight">Business</span>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-border/50 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold truncate text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user.handle}</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-blue-500/10 text-blue-500" 
                                    : "text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-border/50">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-5 h-5" />
                        Back to Werfie
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <span className="font-bold">Business Suite</span>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content Header */}
                <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-border bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                    <h1 className="text-2xl font-bold">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    <div className="flex items-center gap-4">
                        <Button size="icon" variant="ghost" className="rounded-full">
                            <Bell className="w-5 h-5" />
                        </Button>
                        <Button className="rounded-full bg-white text-black hover:bg-white/90 font-bold">
                            Create Ad
                        </Button>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-6xl mx-auto">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-border flex justify-around p-2 z-20 pb-safe">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-[10px] font-medium min-w-[64px]",
                            activeTab === tab.id 
                                ? "text-blue-500" 
                                : "text-muted-foreground"
                        )}
                    >
                        <tab.icon className="w-6 h-6" />
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    )
}
