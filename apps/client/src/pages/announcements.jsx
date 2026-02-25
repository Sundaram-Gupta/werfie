import { Layout } from "lucide-react"
import OfficialAnnouncementDashboard from "@/components/announcements/OfficialAnnouncementDashboard"
import AnnouncementFeed from "@/components/announcements/AnnouncementFeed"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Announcements() {
    return (
        <div className="flex flex-col h-screen w-full mx-auto">
            <Tabs defaultValue="create" className="w-full h-full flex flex-col">
                <div className="px-6 pt-4 border-b border-border/50 flex items-center justify-between">
                    <TabsList className="bg-muted/50 p-1 rounded-full mb-2">
                        <TabsTrigger value="create" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Create Announcement
                        </TabsTrigger>
                        <TabsTrigger value="feed" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Official Feed
                        </TabsTrigger>
                        <TabsTrigger value="archive" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Archive Explorer
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="create" className="flex-1 overflow-hidden mt-0">
                    <OfficialAnnouncementDashboard />
                </TabsContent>
                
                <TabsContent value="feed" className="flex-1 overflow-y-auto p-6 mt-0 no-scrollbar">
                    <div className="max-w-2xl mx-auto">
                        <AnnouncementFeed />
                    </div>
                </TabsContent>

                <TabsContent value="archive" className="flex-1 overflow-y-auto p-6 mt-0">
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                        <Layout className="w-12 h-12 opacity-20" />
                        <p className="font-medium">Archive Explorer searching for historical records...</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
