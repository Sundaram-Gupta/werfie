import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

const TITLES = {
    "blocked-accounts": "Blocked accounts",
    "muted-accounts": "Muted accounts",
    "muted-words": "Muted words",
    "muted-notifications": "Muted notifications",
}

export default function MuteBlockPlaceholder() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const section = pathname.replace("/settings/", "")
    const title = TITLES[section] || section

    return (
        <div>
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <h1 className="text-[20px] font-bold leading-6">{title}</h1>
            </div>
            <div className="px-4 py-8 text-muted-foreground text-sm">
                {title} – coming soon.
            </div>
        </div>
    )
}
