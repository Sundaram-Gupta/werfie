import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, Wallet, Gift, Lock, Settings, ArrowLeft, MoreHorizontal, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import MonetizationOverview from "./MonetizationOverview"
import Subscriptions from "./Subscriptions"
import Tips from "./Tips"
import Payouts from "./Payouts"

export default function MonetizationLayout() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("overview")

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "subscriptions", label: "Subscriptions", icon: Lock },
        { id: "tips", label: "Tips", icon: Gift },
        { id: "payouts", label: "Payouts", icon: Wallet },
        { id: "settings", label: "Settings", icon: Settings },
    ]

    const renderContent = () => {
        switch (activeTab) {
            case "overview": return <MonetizationOverview />
            case "subscriptions": return <Subscriptions />
            case "tips": return <Tips />
            case "payouts": return <Payouts />
            case "settings": return <div className="p-10 text-center text-muted-foreground">Monetization Settings Coming Soon</div>
            default: return <MonetizationOverview />
        }
    }

    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
            {/* Sidebar (Desktop) */}
            <aside className="w-64 border-r border-border sticky top-0 h-screen hidden md:flex flex-col bg-black">
                <div className="p-4 border-b border-border/50">
                    <div className="flex items-center gap-2 mb-6 text-green-500">
                        <Wallet className="w-6 h-6" />
                        <span className="font-bold text-xl tracking-tight text-white">Monetization</span>
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
                                    ? "bg-green-500/10 text-green-500" 
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
                    <span className="font-bold">Monetization</span>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content Header */}
                <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-border bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                    <h1 className="text-2xl font-bold">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    <div className="flex items-center gap-4">
                       {/* Header Actions Placeholder */}
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
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
                                ? "text-green-500" 
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
