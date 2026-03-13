import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function MutedAccountsSettings() {
    const navigate = useNavigate()

    return (
        <div>
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition -ml-2">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <h1 className="text-[20px] font-bold leading-6">Muted accounts</h1>
            </div>

            <div className="px-4 py-6 pb-20">
                <p className="text-[15px] text-muted-foreground">
                    Here's everyone you muted. You can add or remove them from this list.{" "}
                    <a href="#" className="text-primary hover:underline">Learn more</a>
                </p>

                {/* Empty state */}
                <div className="mt-10">
                    <h2 className="text-[20px] font-bold text-foreground mb-3">Muted accounts</h2>
                    <p className="text-[15px] text-muted-foreground">
                        Posts from muted accounts won't show up in your Home timeline. Mute accounts directly from their profile or post.{" "}
                        <a href="#" className="text-primary hover:underline">Learn more</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
