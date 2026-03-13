import { Check, UserPlus, MessageSquare, User, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

export function SetupProgress() {
    const steps = [
        {
            id: 1,
            title: "Follow 5 accounts",
            status: "progress", // progress, done
            current: 1,
            total: 5,
            icon: UserPlus,
            gradient: "from-violet-500 to-fuchsia-500",
            label: "4 left"
        },
        {
            id: 2,
            title: "Follow 3 Topics",
            status: "progress",
            current: 0,
            total: 3,
            icon: MessageSquare,
            gradient: "from-amber-500 to-orange-500",
            label: "3 left"
        },
        {
            id: 3,
            title: "Complete your profile",
            status: "done",
            icon: User,
            gradient: "from-cyan-500 to-blue-500",
            label: "DONE"
        },
        {
            id: 4,
            title: "Turn on notifications",
            status: "done",
            icon: Bell,
            gradient: "from-pink-500 to-rose-500",
            label: "DONE"
        }
    ]

    return (
        <div className="py-4 border-b border-border/50">
            <h2 className="text-[20px] font-bold px-4 mb-4">Let's get you set up</h2>
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
                {steps.map((step) => (
                    <div 
                        key={step.id} 
                        className={cn(
                            "min-w-[260px] h-[140px] rounded-2xl relative overflow-hidden p-4 flex flex-col justify-between shrink-0 cursor-pointer transition-transform hover:scale-[1.02]",
                            "bg-gradient-to-br",
                            step.gradient
                        )}
                    >
                        <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
                        
                        <div className="relative z-10 text-white">
                            {/* Icon would surely go somewhere, but in the screenshot it's just a large background graphic or centered. 
                                We'll center it for now as a large watermark or place it nicely.
                            */}
                            <div className="absolute right-2 top-2 opacity-50">
                                <step.icon className="w-16 h-16" />
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                            {/* Status Pill */}
                            <div className={cn(
                                "w-max px-3 py-1 rounded-md text-xs font-bold mb-2",
                                step.status === "done" 
                                    ? "bg-emerald-500 text-white" 
                                    : "bg-black/40 text-white backdrop-blur-sm"
                            )}>
                                {step.label}
                            </div>
                            
                            {/* Title (implied, though not clearly visible in the small cards in the screenshot, usually these have titles) */}
                            {/* The screenshot doesn't show titles inside the cards clearly, but it's good UX. 
                                Wait, actually looking closely at the screenshot... I don't see titles inside the cards. 
                                Just the icons and the status pill. 
                                But usually you need to know what the card is for. 
                                Ah, maybe the text "Follow 5 accounts" IS the title? 
                                Yes, looking at the crop 4, "Let's get you set up" is the header.
                                The cards have "4 left", "3 left", "DONE".
                                I will render the icon centered and large.
                            */}
                        </div>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                             <step.icon className="w-16 h-16 text-white/80" strokeWidth={1.5} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
