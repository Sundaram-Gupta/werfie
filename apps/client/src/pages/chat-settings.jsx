import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export default function ChatSettings() {
    const navigate = useNavigate()
    const [messageRequests, setMessageRequests] = useState("no_one")
    const [audioVideoEnabled, setAudioVideoEnabled] = useState(true)
    const [addressBookCalls, setAddressBookCalls] = useState(false)
    const [followingCalls, setFollowingCalls] = useState(true)
    const [verifiedCalls, setVerifiedCalls] = useState(false)
    const [everyoneCalls, setEveryoneCalls] = useState(false)
    const [relayCalls, setRelayCalls] = useState(false)
    const [subscriberMessages, setSubscriberMessages] = useState(false)
    const [filterLowQuality, setFilterLowQuality] = useState(true)

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-black border-b border-border">
                <button type="button" onClick={() => navigate("/chat")} className="p-2 -ml-2 hover:bg-white/[0.06] rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-[20px] font-bold">Settings</h1>
            </div>

            <div className="divide-y divide-border pb-20">
                {/* Allow message requests from */}
                <div className="px-4 py-4">
                    <h3 className="font-semibold text-[15px] mb-1">Allow message requests from</h3>
                    <p className="text-[14px] text-muted-foreground mb-4">
                        People you follow will always be able to message you.{" "}
                        <button type="button" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit">Learn more</button>
                    </p>
                    <div className="space-y-2">
                        {["no_one", "verified", "everyone"].map((opt) => (
                            <label key={opt} className="flex items-center gap-3 py-2 cursor-pointer">
                                <div
                                    onClick={() => setMessageRequests(opt)}
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition",
                                        messageRequests === opt ? "border-blue-500" : "border-muted-foreground"
                                    )}
                                >
                                    {messageRequests === opt && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                </div>
                                <span className="text-[15px] capitalize">{opt === "no_one" ? "No one" : opt === "verified" ? "Verified users" : "Everyone"}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Enable audio and video calling */}
                <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-[15px] mb-1">Enable audio and video calling</h3>
                            <p className="text-[14px] text-muted-foreground">
                                Take messaging to the next level with audio and video calls. When enabled, you can select who you're comfortable using it with.{" "}
                                <button type="button" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit">Learn more</button>
                            </p>
                        </div>
                        <Switch checked={audioVideoEnabled} onCheckedChange={setAudioVideoEnabled} className="shrink-0" />
                    </div>
                </div>

                {/* Allow audio and video calls from */}
                <div className="px-4 py-4">
                    <p className="text-[14px] text-muted-foreground mb-4">
                        To reduce unwanted calls, you'll need to have messaged an account at least once before they're able to call you.
                    </p>
                    <div className="space-y-3">
                        {[
                            { key: "addressBook", label: "People in your address book", checked: addressBookCalls, set: setAddressBookCalls },
                            { key: "following", label: "People you follow", checked: followingCalls, set: setFollowingCalls },
                            { key: "verified", label: "Verified users", checked: verifiedCalls, set: setVerifiedCalls },
                            { key: "everyone", label: "Everyone", checked: everyoneCalls, set: setEveryoneCalls },
                        ].map(({ key, label, checked, set }) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => set(!checked)}
                                    className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition",
                                        checked ? "bg-blue-500 border-blue-500" : "border-muted-foreground"
                                    )}
                                >
                                    {checked && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                </div>
                                <span className="text-[15px]">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Always relay calls */}
                <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-[15px] mb-1">Always relay calls</h3>
                            <p className="text-[14px] text-muted-foreground">
                                Enable this setting to avoid revealing your IP address to your contact during the call. This will reduce call quality.{" "}
                                <button type="button" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit">Learn more</button>
                            </p>
                        </div>
                        <Switch checked={relayCalls} onCheckedChange={setRelayCalls} className="shrink-0" />
                    </div>
                </div>

                {/* Allow messages from my subscribers */}
                <div className="px-4 py-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-[15px] mb-1">Allow messages from my subscribers</h3>
                            <p className="text-[14px] text-muted-foreground">
                                Your subscribers will always be able to send you messages independent of other messaging settings.{" "}
                                <button type="button" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit">Learn more</button>
                            </p>
                        </div>
                        <div
                            onClick={() => setSubscriberMessages(!subscriberMessages)}
                            className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition",
                                subscriberMessages ? "bg-blue-500 border-blue-500" : "border-muted-foreground"
                            )}
                        >
                            {subscriberMessages && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                    </div>
                </div>

                {/* Filter low-quality messages */}
                <div className="px-4 py-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <h3 className="font-semibold text-[15px] mb-1">Filter low-quality messages</h3>
                            <p className="text-[14px] text-muted-foreground">
                                Hide message requests that have been detected as being potentially spam or low-quality. These will be sent to a separate inbox at the bottom of your message requests. You can still access them if you want.{" "}
                                <button type="button" onClick={(e) => e.preventDefault()} className="text-blue-500 hover:underline bg-transparent border-none p-0 cursor-pointer font-inherit">Learn more</button>
                            </p>
                        </div>
                        <div
                            onClick={() => setFilterLowQuality(!filterLowQuality)}
                            className={cn(
                                "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition",
                                filterLowQuality ? "bg-blue-500 border-blue-500" : "border-muted-foreground"
                            )}
                        >
                            {filterLowQuality && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
