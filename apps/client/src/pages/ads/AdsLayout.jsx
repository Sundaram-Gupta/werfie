import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { LayoutDashboard, Megaphone, Settings, CreditCard, ArrowLeft, MoreHorizontal, HelpCircle, Store } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import AdsDashboard from "./AdsDashboard"
import CampaignManager from "./CampaignManager"
import CreateCampaign from "./CreateCampaign"
import Billing from "./Billing"

export default function AdsLayout() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("dashboard")
    const [isLoading, setIsLoading] = useState(true)
    const [hasBusinessProfile, setHasBusinessProfile] = useState(true)

    const tabs = [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "campaigns", label: "Campaigns", icon: Megaphone },
        { id: "create", label: "Create Ad", icon: null }, // Hidden from nav, routed via action
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "settings", label: "Settings", icon: Settings },
    ]

    useEffect(() => {
        const checkAccount = async () => {
            try {
                await api.get('/api/ads/account')
                setHasBusinessProfile(true)
            } catch (err) {
                if (err.response?.status === 404 && err.response?.data?.error?.includes('Business profile')) {
                    setHasBusinessProfile(false)
                }
            } finally {
                setIsLoading(false)
            }
        }
        checkAccount()
    }, [])

    const handleTabChange = (id) => {
        if (id === 'create') {
            setActiveTab('create')
        } else {
            setActiveTab(id)
        }
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Checking business account...</p>
                </div>
            )
        }

        if (!hasBusinessProfile) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/50 border border-dashed border-border rounded-2xl text-center space-y-6 max-w-2xl mx-auto my-12">
                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                        <Store className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-2">Business Profile Required</h2>
                        <p className="text-muted-foreground">
                            To start advertising on Werfie, you first need to set up a business profile. 
                            This helps us verify your business and provide better ad targeting.
                        </p>
                    </div>
                    <Button 
                        size="lg" 
                        className="rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold px-8"
                        onClick={() => navigate('/business')}
                    >
                        Setup Business Profile
                    </Button>
                </div>
            )
        }

        switch (activeTab) {
            case "dashboard": return <AdsDashboard />
            case "campaigns": return <CampaignManager onCreateClick={() => setActiveTab('create')} />
            case "create": return <CreateCampaign onFinish={() => setActiveTab('campaigns')} />
            case "billing": return <Billing />
            case "settings": return <div className="p-10 text-center text-muted-foreground">Ad Account Settings Coming Soon</div>
            default: return <AdsDashboard />
        }
    }

    return (
        <div className="min-h-screen bg-black text-foreground flex flex-col md:flex-row">
            {/* Ads Sidebar (Desktop) */}
            <aside className="w-64 border-r border-border sticky top-0 h-screen hidden md:flex flex-col bg-black">
                <div className="p-4 border-b border-border/50">
                    <div className="flex items-center gap-2 mb-6 text-blue-500">
                        <Megaphone className="w-6 h-6" />
                        <span className="font-bold text-xl tracking-tight text-white">Ads Manager</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {tabs.filter(t => t.icon).map((tab) => (
                        <button
                            key={tab.id}
                            disabled={!hasBusinessProfile && tab.id !== 'dashboard'}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-blue-500/10 text-blue-500" 
                                    : "text-muted-foreground hover:bg-zinc-900 hover:text-foreground",
                                !hasBusinessProfile && tab.id !== 'dashboard' && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                    
                    <div className="pt-4 mt-4 border-t border-border/30">
                         <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-zinc-900 hover:text-foreground text-sm font-medium">
                            <HelpCircle className="w-5 h-5" />
                            Help Center
                        </button>
                    </div>
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
                    <span className="font-bold">Ads Manager</span>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content Header */}
                <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-border bg-black/50 backdrop-blur-sm sticky top-0 z-10">
                    <h1 className="text-2xl font-bold">
                        {activeTab === 'create' ? 'Create Campaign' : tabs.find(t => t.id === activeTab)?.label}
                    </h1>
                    {activeTab !== 'create' && hasBusinessProfile && (
                        <Button 
                            className="rounded-full bg-white text-black hover:bg-white/90 font-bold"
                            onClick={() => handleTabChange('create')}
                        >
                            + Create Campaign
                        </Button>
                    )}
                </header>

                <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
                    {renderContent()}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-border flex justify-around p-2 z-20 pb-safe">
                {tabs.filter(t => t.icon).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
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
