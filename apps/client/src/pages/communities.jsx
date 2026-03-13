import { useState, useEffect } from "react"
import { searchService } from "@/services/api"
import { Search, Settings, ArrowLeft, UsersRound } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function Communities() {
    const navigate = useNavigate()
    const [communities, setCommunities] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const data = await searchService.getCommunities()
                setCommunities(data)
            } catch (error) {
                console.error("Failed to load communities", error)
            } finally {
                setLoading(false)
            }
        }
        fetchCommunities()
    }, [])

    const joinedCommunities = communities.filter(c => c.isJoined)
    const discoverCommunities = communities

    return (
        <div>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition md:hidden">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <h1 className="text-[20px] font-bold">Communities</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Search className="w-5 h-5 cursor-pointer" />
                    <UsersRound className="w-5 h-5 cursor-pointer" />
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading communities...</div>
            ) : (
                <div className="pb-20">
                    {/* Joined Communities */}
                    {joinedCommunities.length > 0 && (
                        <div className="border-b border-border/50 py-4">
                            <h2 className="px-4 text-[20px] font-bold mb-4">Your Communities</h2>
                            <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 pb-2">
                                {joinedCommunities.map(community => (
                                    <Link to={`/communities/${community.id}`} key={community.id} className="flex-none w-[150px] group cursor-pointer">
                                        <div className="relative h-[80px] w-full rounded-t-xl overflow-hidden bg-zinc-800">
                                            {community.banner ? (
                                                <img src={community.banner} className="w-full h-full object-cover group-hover:opacity-90 transition" />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800" />
                                            )}
                                        </div>
                                        <div className="bg-zinc-900/50 border border-border/50 border-t-0 p-3 rounded-b-xl h-[90px] relative">
                                            <Avatar className="w-10 h-10 border-2 border-background absolute -top-5 left-3">
                                                <AvatarImage src={community.avatar} />
                                                <AvatarFallback>{community.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="mt-4">
                                                <div className="font-bold text-[15px] truncate leading-5 group-hover:underline">{community.name}</div>
                                                <div className="text-[13px] text-muted-foreground">{community.membersCount} members</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Discover Communities */}
                    <div className="py-4">
                        <h2 className="px-4 text-[20px] font-bold mb-4">Discover Communities</h2>
                        <div className="px-4 space-y-4">
                            {discoverCommunities.map(community => (
                                <div key={community.id} className="flex gap-4 p-4 border border-border/50 rounded-xl hover:bg-white/[0.03] transition cursor-pointer" onClick={() => navigate(`/communities/${community.id}`)}>
                                    <Avatar className="w-12 h-12 rounded-xl">
                                        <AvatarImage src={community.avatar} className="object-cover" />
                                        <AvatarFallback>{community.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-[15px] hover:underline">{community.name}</div>
                                                <div className="text-[13px] text-muted-foreground">{community.membersCount} members</div>
                                            </div>
                                            <Button variant={community.isJoined ? "outline" : "secondary"} className="rounded-full font-bold h-8 px-4 text-[14px]">
                                                {community.isJoined ? "Joined" : "Join"}
                                            </Button>
                                        </div>
                                        <p className="text-[15px] text-muted-foreground mt-1 line-clamp-2 leading-5">
                                            {community.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
