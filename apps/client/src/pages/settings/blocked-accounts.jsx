import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function BlockedAccountsSettings() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState("all")

    const infoText = "When you block someone, that person won't be able to follow or message you, and you won't see notifications from them."

    return (
        <div>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="flex items-center gap-4 px-4 py-3">
                    <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition -ml-2">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <h1 className="text-[20px] font-bold leading-6">Blocked accounts</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 px-4">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`pb-3 pt-1 text-[15px] font-medium border-b-2 transition ${
                            activeTab === "all"
                                ? "text-foreground border-primary"
                                : "text-muted-foreground border-transparent hover:text-foreground"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveTab("imported")}
                        className={`pb-3 pt-1 text-[15px] font-medium border-b-2 transition ${
                            activeTab === "imported"
                                ? "text-foreground border-primary"
                                : "text-muted-foreground border-transparent hover:text-foreground"
                        }`}
                    >
                        Imported
                    </button>
                </div>
            </div>

            <div className="px-4 py-6 pb-20">
                <p className="text-[15px] text-muted-foreground">
                    {infoText}{" "}
                    <a href="#" className="text-primary hover:underline">Learn more</a>
                </p>

                {/* Empty state */}
                <div className="mt-10">
                    <h2 className="text-[20px] font-bold text-foreground mb-3">Block unwanted accounts</h2>
                    <p className="text-[15px] text-muted-foreground">
                        {infoText}{" "}
                        <a href="#" className="text-primary hover:underline">Learn more</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
