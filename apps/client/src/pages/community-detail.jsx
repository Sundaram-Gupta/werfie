
import { useParams, useNavigate } from "react-router-dom"
import { COMMUNITIES_DATA } from "@/lib/dummy-data"
import { ArrowLeft, MoreHorizontal, Search, Share } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/feed/post-card"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function CommunityDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const community = COMMUNITIES_DATA.find(c => c.id === id)
    const [isJoined, setIsJoined] = useState(community?.isJoined || false)

    if (!community) {
        return <div className="p-8 text-center">Community not found</div>
    }

    return (
        <div>
            {/* Header / Banner */}
            <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-background/80 backdrop-blur-md">
                <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-[20px] font-bold leading-5">{community.name}</h1>
                    <span className="text-[13px] text-muted-foreground">{community.membersCount} members</span>
                </div>
                <div className="ml-auto flex gap-2">
                    <Search className="w-5 h-5" />
                    <MoreHorizontal className="w-5 h-5" />
                </div>
            </div>

            <div className="h-[200px] bg-zinc-800 w-full relative">
                {community.banner && (
                    <img src={community.banner} className="w-full h-full object-cover" />
                )}
            </div>

            <div className="px-4 relative mb-4">
                <div className="flex justify-between items-end -mt-10 mb-3">
                    <Avatar className="w-[80px] h-[80px] border-4 border-background rounded-2xl">
                        <AvatarImage src={community.avatar} />
                        <AvatarFallback>{community.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex gap-2 pb-1">
                        <div className="p-2 border border-border/50 rounded-full hover:bg-muted/50 cursor-pointer transition">
                            <Share className="w-5 h-5" />
                        </div>
                        <Button
                            variant={isJoined ? "outline" : "secondary"}
                            className="rounded-full font-bold w-[100px]"
                            onClick={() => setIsJoined(!isJoined)}
                        >
                            {isJoined ? "Joined" : "Join"}
                        </Button>
                    </div>
                </div>
                <h1 className="text-[22px] font-bold leading-6 mb-1">{community.name}</h1>
                <p className="text-[15px] text-muted-foreground mb-3">{community.description}</p>
                <div className="flex gap-4 text-[14px]">
                    <span className="font-bold text-foreground">{community.membersCount} <span className="text-muted-foreground font-normal">Members</span></span>
                    <span className="font-bold text-foreground">120 <span className="text-muted-foreground font-normal">Online</span></span>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="w-full h-auto bg-transparent border-b border-border/50 p-0 overflow-x-auto justify-start no-scrollbar">
                    {["Posts", "About", "Members", "Rules"].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab.toLowerCase()}
                            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-4 text-[15px] hover:bg-muted/50 transition font-bold text-muted-foreground data-[state=active]:text-foreground"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="posts" className="mt-0">
                    {community.posts && community.posts.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {community.posts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            No posts yet. Be the first to post!
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="about" className="mt-0 p-4">
                    <div className="space-y-6">
                        <section>
                            <h3 className="font-bold text-lg mb-2">About</h3>
                            <p className="text-muted-foreground leading-relaxed">{community.description}</p>
                        </section>
                        {community.moderators && community.moderators.length > 0 && (
                            <section>
                                <h3 className="font-bold text-lg mb-4">Moderators</h3>
                                <div className="space-y-4">
                                    {community.moderators.map(mod => (
                                        <div key={mod.handle} className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={mod.avatar} />
                                                <AvatarFallback>{mod.handle[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold hover:underline cursor-pointer">{mod.name}</div>
                                                <div className="text-muted-foreground text-sm">@{mod.handle}</div>
                                            </div>
                                            <Button size="sm" variant="outline" className="ml-auto rounded-full">Follow</Button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="members" className="mt-0 p-4">
                    <div className="space-y-4">
                        {community.members && community.members.length > 0 ? (
                            community.members.map(member => (
                                <div key={member.handle} className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback>{member.handle[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold hover:underline cursor-pointer">{member.name}</div>
                                        <div className="text-muted-foreground text-sm">@{member.handle}</div>
                                    </div>
                                    <Button size="sm" variant="outline" className="ml-auto rounded-full">Follow</Button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">Member list hidden or empty.</div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="rules" className="mt-0 p-4">
                    <div className="space-y-1">
                        {community.rules && community.rules.length > 0 ? (
                            community.rules.map((rule, idx) => (
                                <div key={idx} className="p-4 border-b border-border/50 last:border-0">
                                    <div className="font-bold text-[15px] mb-1">Rule {idx + 1}</div>
                                    <p className="text-muted-foreground text-[15px]">{rule}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground">No specific rules listed.</div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
