import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus } from "lucide-react"

export default function MutedWordsSettings() {
    const navigate = useNavigate()

    const handleAdd = () => {
        // TODO: Open add muted word modal
    }

    return (
        <div>
            <div className="sticky top-0 z-10 flex items-center px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition -ml-2 flex-shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <h1 className="flex-1 text-[20px] font-bold leading-6 text-center pr-10">Muted words</h1>
                <button
                    onClick={handleAdd}
                    className="p-2 rounded-full hover:bg-muted/50 transition text-foreground cursor-pointer flex-shrink-0 -mr-2"
                    aria-label="Add muted word"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="px-4 py-10 pb-20">
                <h2 className="text-[20px] font-bold text-foreground mb-3">Add muted words</h2>
                <p className="text-[15px] text-muted-foreground">
                    When you mute words, you won't get any new notifications for posts that include them or see posts with those words in your Home timeline.{" "}
                    <a href="#" className="text-primary hover:underline">Learn more</a>
                </p>
            </div>
        </div>
    )
}
