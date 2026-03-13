import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight } from "lucide-react"

export default function MuteAndBlockSettings() {
    const navigate = useNavigate()

    const items = [
        { label: "Blocked accounts", path: "/settings/blocked-accounts" },
        { label: "Muted accounts", path: "/settings/muted-accounts" },
        { label: "Muted words", path: "/settings/muted-words" },
        { label: "Muted notifications", path: "/settings/muted-notifications" },
    ]

    return (
        <div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold leading-6">Mute and block</h1>
                    <p className="text-[13px] text-muted-foreground">Manage the accounts, words, and notifications that you've muted or blocked.</p>
                </div>
            </div>

            <div className="divide-y divide-border/50 pb-20">
                {items.map((item) => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer"
                    >
                        <span className="font-medium text-[15px]">{item.label}</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    )
}
