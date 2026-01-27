import { useState, useEffect } from "react"
import { searchService, spaceService } from "@/services/api"
import { ArrowLeft, Mic, Calendar, Users, Globe, Lock, Loader2, Signal, Radio } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export default function Spaces() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [spacesData, setSpacesData] = useState({ upcoming: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const data = await searchService.getSpaces()
                setSpacesData(data)
            } catch (error) {
                console.error("Failed to load spaces", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSpaces()
    }, [])

    const { upcoming } = spacesData


    // State
    const [spaceName, setSpaceName] = useState("")
    const [selectedTopics, setSelectedTopics] = useState([])
    const [isStarting, setIsStarting] = useState(false)
    const [isLive, setIsLive] = useState(false)

    const topics = ["Technology", "Music", "Business", "Gaming", "Sports", "Politics", "Art"]

    const toggleTopic = (topic) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic))
        } else {
            if (selectedTopics.length < 3) {
                setSelectedTopics([...selectedTopics, topic])
            }
        }
    }

    const fetchSpaces = async () => {
        try {
            const data = await spaceService.getAll()
            setSpacesData(data)
        } catch (error) {
            console.error("Failed to load spaces", error)
        } finally {
            setLoading(false)
        }
    }

    const handleStartSpace = async () => {
        if (!spaceName.trim()) return
        setIsStarting(true)

        try {
            await spaceService.createSpace({
                title: spaceName,
                topics: selectedTopics,
                privacy,
                scheduledAt: isScheduling && scheduleDate ? scheduleDate : null
            })

            if (isScheduling) {
                alert("Space scheduled successfully!")
                setIsScheduling(false)
                setSpaceName("")
                setScheduleDate("")
                fetchSpaces() // Refresh list
            } else {
                setIsLive(true)
            }
        } catch (error) {
            console.error("Failed to create space", error)
            alert("Failed to create space. Please try again.")
        } finally {
            setIsStarting(false)
        }
    }

    const handleEndSpace = () => {
        setIsLive(false)
        setSpaceName("")
        setSelectedTopics([])
    }

    const handleJoinSpace = (space) => {
        setSpaceName(space.title)
        setSelectedTopics(space.topics || ["General"])
        setIsLive(true)
    }

    const [reminders, setReminders] = useState({})
    const [isMuted, setIsMuted] = useState(true)
    const [isHandRaised, setIsHandRaised] = useState(false)
    const [showGuests, setShowGuests] = useState(false)

    // Hosting State
    const [privacy, setPrivacy] = useState("public") // 'public' or 'followers'
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduleDate, setScheduleDate] = useState("")

    const handleReminder = (e, spaceId) => {
        e.stopPropagation()
        setReminders(prev => ({
            ...prev,
            [spaceId]: !prev[spaceId]
        }))
    }

    const toggleMute = () => setIsMuted(!isMuted)

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
        // In a real app we'd show a toast here
        alert("Space link copied to clipboard!")
    }

    const handleGuests = () => {
        setShowGuests(!showGuests)
    }

    if (isLive) {
        return (
            <div className="h-screen bg-gradient-to-br from-[#1d9bf0] via-[#8c1af5] to-[#f91880] flex flex-col items-center justify-between text-white p-6 relative overflow-hidden animate-gradient bg-[length:400%_400%]">
                {/* Background pulse effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full animate-pulse blur-3xl pointer-events-none" />

                <div className="w-full flex justify-between items-center z-10">
                    <button onClick={handleEndSpace} className="p-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm"><ArrowLeft className="w-6 h-6" /></button>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 shadow-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live
                    </div>
                </div>

                <div className="flex flex-col items-center z-10 text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                        <Avatar className="w-28 h-28 border-4 border-white shadow-2xl relative z-10">
                            <AvatarImage src={user?.profile?.avatar || user?.avatar || "/websplash.png"} />
                            <AvatarFallback>You</AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 bg-primary border-4 border-[#8c1af5] rounded-full p-1.5 z-20">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight drop-shadow-lg">{spaceName}</h1>
                        <div className="flex items-center justify-center gap-2 text-white/90 font-medium bg-black/20 backdrop-blur-sm px-4 py-1.5 rounded-full w-fit mx-auto">
                            <span>@{user?.profile?.handle || user?.handle || "user"}</span>
                            <span className="w-1 h-1 bg-white rounded-full" />
                            <span className="uppercase text-xs tracking-wider opacity-80">Host</span>
                        </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-center">
                        {selectedTopics.map(tag => (
                            <span key={tag} className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-sm font-bold border border-white/10 shadow-sm transition cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="w-full z-10 space-y-6 max-w-md">
                    <div className="flex justify-center gap-12 text-center">
                        <div className="group cursor-pointer">
                            <div className="text-2xl font-black mb-1 drop-shadow-md group-hover:scale-110 transition">0</div>
                            <div className="text-sm font-medium opacity-80 uppercase tracking-wider">Listening</div>
                        </div>
                        <div className="group cursor-pointer">
                            <div className="text-2xl font-black mb-1 drop-shadow-md group-hover:scale-110 transition">0</div>
                            <div className="text-sm font-medium opacity-80 uppercase tracking-wider">Speakers</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 px-4">
                        <button
                            onClick={toggleMute}
                            className={cn(
                                "aspect-square rounded-2xl backdrop-blur-md flex flex-col items-center justify-center gap-1 transition border border-white/5",
                                isMuted ? "bg-red-500/20 hover:bg-red-500/30 text-red-200" : "bg-white/10 hover:bg-white/20"
                            )}
                        >
                            <Mic className={cn("w-6 h-6", isMuted && "text-red-400")} />
                            <span className="text-[10px] font-bold">{isMuted ? "Unmute" : "Mute"}</span>
                        </button>

                        <button
                            onClick={handleGuests}
                            className={cn(
                                "aspect-square rounded-2xl backdrop-blur-md flex flex-col items-center justify-center gap-1 transition border border-white/5",
                                showGuests ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-200" : "bg-white/10 hover:bg-white/20"
                            )}
                        >
                            <Users className="w-6 h-6" />
                            <span className="text-[10px] font-bold">Guests</span>
                        </button>

                        <button className="aspect-square rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex flex-col items-center justify-center gap-1 transition border border-white/5">
                            <Signal className="w-6 h-6" />
                            <span className="text-[10px] font-bold">Sound</span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="aspect-square rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex flex-col items-center justify-center gap-1 transition border border-white/5"
                        >
                            <Globe className="w-6 h-6" />
                            <span className="text-[10px] font-bold">Share</span>
                        </button>
                    </div>

                    {showGuests && (
                        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="font-bold mb-3 text-sm uppercase tracking-wider opacity-80">Current Speakers</h3>
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-primary">
                                    <AvatarImage src={user?.profile?.avatar || user?.avatar || "/websplash.png"} />
                                    <AvatarFallback>You</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-bold text-sm">You (Host)</div>
                                    <div className="text-xs opacity-60">Speaking</div>
                                </div>
                                <Mic className={cn("w-4 h-4 ml-auto", isMuted ? "text-red-400" : "text-green-400")} />
                            </div>
                        </div>
                    )}

                    <Button onClick={handleEndSpace} className="w-full bg-white text-black hover:bg-white/90 border-none font-black rounded-full h-14 text-lg shadow-xl hover:scale-[1.02] transition-transform active:scale-95">
                        End Space
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h1 className="text-[20px] font-bold leading-5">Audio Spaces</h1>
                </div>
            </div>

            <div className="p-4 space-y-8 pb-20">

                {/* Create Space Card */}
                <div>
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#794bc4] to-[#1d9bf0] rounded-3xl p-6 text-white shadow-2xl">
                        {/* Decorative background circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-xl" />

                        <h2 className="text-[24px] font-black mb-6 flex items-center gap-2 relative z-10">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-full">
                                <Radio className="w-6 h-6 text-white" />
                            </div>
                            Host your Space
                        </h2>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold uppercase tracking-wider opacity-80 ml-1">Name your Space</label>
                                <input
                                    type="text"
                                    value={spaceName}
                                    onChange={e => setSpaceName(e.target.value)}
                                    placeholder="What do you want to talk about?"
                                    className="w-full bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 text-[18px] font-medium outline-none placeholder-white/40 focus:bg-black/40 transition shadow-inner text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-bold uppercase tracking-wider opacity-80 mb-3 block ml-1">Select Topics (Max 3)</label>
                                <div className="flex gap-2 flex-wrap">
                                    {topics.map(tag => (
                                        <span
                                            key={tag}
                                            onClick={() => toggleTopic(tag)}
                                            className={cn(
                                                "px-4 py-2 rounded-full cursor-pointer text-[14px] font-bold transition select-none flex items-center gap-1 backdrop-blur-sm border",
                                                selectedTopics.includes(tag)
                                                    ? "bg-white text-[#794bc4] border-white shadow-lg scale-105"
                                                    : "bg-white/10 border-white/10 hover:bg-white/20 text-white"
                                            )}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 pt-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div
                                            onClick={() => setPrivacy("public")}
                                            className={cn(
                                                "flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full transition select-none",
                                                privacy === "public" ? "bg-white/20 font-bold" : "hover:bg-white/10 opacity-60"
                                            )}
                                        >
                                            <Globe className="w-4 h-4" />
                                            <span className="text-[14px]">Public</span>
                                        </div>
                                        <div
                                            onClick={() => setPrivacy("followers")}
                                            className={cn(
                                                "flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full transition select-none",
                                                privacy === "followers" ? "bg-white/20 font-bold" : "hover:bg-white/10 opacity-60"
                                            )}
                                        >
                                            <Lock className="w-4 h-4" />
                                            <span className="text-[14px]">Followers only</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsScheduling(!isScheduling)}
                                            className={cn("rounded-full font-bold text-white hover:bg-white/20 hover:text-white transition", isScheduling && "bg-white/20")}
                                        >
                                            <Calendar className="w-4 h-4 mr-2" /> {isScheduling ? "Cancel" : "Schedule"}
                                        </Button>

                                        {!isScheduling && (
                                            <Button
                                                onClick={handleStartSpace}
                                                disabled={!spaceName.trim() || isStarting}
                                                className={cn(
                                                    "rounded-full font-black px-10 h-12 text-[16px] transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed",
                                                    !spaceName.trim()
                                                        ? "bg-white/20 text-white/50"
                                                        : "bg-[#f91880] text-white hover:shadow-[0_0_30px_rgba(249,24,128,0.5)] border border-transparent"
                                                )}
                                            >
                                                {isStarting ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                        Launching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mic className="w-5 h-5 mr-2 fill-current" />
                                                        Start Now
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {isScheduling && (
                                    <div className="animate-in fade-in slide-in-from-top-2 bg-black/20 backdrop-blur-md rounded-xl p-4 flex flex-col gap-4 border border-white/10">
                                        <div className="space-y-1">
                                            <label className="text-[12px] font-bold uppercase tracking-wider opacity-80">Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/30 transition"
                                                value={scheduleDate}
                                                onChange={e => setScheduleDate(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            className="w-full bg-white text-black hover:bg-white/90 font-bold rounded-full h-10"
                                            disabled={!scheduleDate || !spaceName.trim()}
                                            onClick={() => {
                                                alert(`Scheduled "${spaceName}" for ${new Date(scheduleDate).toLocaleString()}`)
                                                setIsScheduling(false)
                                                setSpaceName("")
                                                setScheduleDate("")
                                            }}
                                        >
                                            Schedule Space
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Spaces */}
                <div>
                    <h2 className="text-[20px] font-bold mb-4 px-1">Happening Now & Upcoming</h2>
                    <div className="space-y-4">
                        {upcoming.map((space, i) => (
                            <div
                                key={space.id}
                                onClick={() => i === 0 ? handleJoinSpace(space) : null} // Make live space clickable
                                className="group relative overflow-hidden flex gap-4 p-5 border border-border/50 rounded-2xl hover:bg-zinc-900/40 transition cursor-pointer bg-zinc-900/20 backdrop-blur-sm"
                            >
                                {/* Subtle styling for each card */}
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5",
                                    i === 0 ? "bg-purple-500" : "bg-zinc-700"
                                )} />

                                <div className="relative">
                                    <Avatar className="w-14 h-14 rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition">
                                        <AvatarImage src={space.avatar} />
                                        <AvatarFallback>{space.host[0]}</AvatarFallback>
                                    </Avatar>
                                    {i === 0 && (
                                        <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-md px-1.5 py-0.5 border-2 border-black flex items-center gap-1 shadow-lg">
                                            <Signal className="w-3 h-3 text-white animate-pulse" />
                                            <span className="text-[9px] font-black text-white uppercase">Live</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className={cn("text-[11px] font-black uppercase tracking-wider mb-1 flex items-center gap-1",
                                            i === 0 ? "text-purple-400" : "text-muted-foreground"
                                        )}>
                                            <Mic className="w-3 h-3" /> {i === 0 ? "Live Audio" : "Scheduled"}
                                        </div>
                                        {i > 0 && (
                                            <Button
                                                size="sm"
                                                variant={reminders[space.id] ? "secondary" : "outline"}
                                                className={cn("h-7 text-xs rounded-full border-zinc-700 hover:bg-zinc-800 transition-all",
                                                    reminders[space.id] && "bg-white text-black hover:bg-white/90 font-bold border-transparent"
                                                )}
                                                onClick={(e) => handleReminder(e, space.id)}
                                            >
                                                {reminders[space.id] ? "Set" : "Remind me"}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="font-bold text-[18px] mb-1 leading-6 group-hover:text-primary transition-colors">{space.title}</div>
                                    <div className="text-[14px] text-muted-foreground flex items-center gap-2">
                                        <span className="text-foreground">Host: {space.host}</span>
                                        <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                        <span>{space.time}</span>
                                    </div>

                                    {i === 0 && (
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(j => (
                                                    <div key={j} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[8px] text-white font-bold">
                                                        U{j}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-xs text-muted-foreground"><span className="text-white font-bold">142</span> listening</div>
                                            <Button
                                                size="sm"
                                                className="ml-auto h-8 rounded-full bg-purple-600 hover:bg-purple-700 font-bold px-4"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleJoinSpace(space)
                                                }}
                                            >
                                                Tune in
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
