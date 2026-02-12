import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Play, Pause, Plus, Trash2, Edit2, Loader2, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import api from "@/lib/api"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function CampaignManager({ onCreateClick }) {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [campaigns, setCampaigns] = useState([])

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/api/ads/campaigns');
                setCampaigns(res.data);
            } catch (err) {
                console.error('Fetch error:', err);
                toast.error(err.response?.data?.error || "Failed to fetch campaigns");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCampaigns();
    }, []);

    const handleCreateClick = () => {
        if (onCreateClick) {
            onCreateClick()
        } else {
            navigate('/ads/create')
        }
    }

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "Active" ? "Paused" : "Active"
        // Simplified: In a real app, call a PATCH endpoint
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c))
        toast.info(`Campaign ${newStatus}`)
    }

    const handleDelete = (id) => {
        // Simplified
        setCampaigns(campaigns.filter(c => c.id !== id))
        toast.success("Campaign deleted locally")
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Campaigns</h2>
                    <p className="text-sm text-muted-foreground">Manage and optimize your ads</p>
                </div>
                <Button className="rounded-full bg-white text-black hover:bg-white/90" onClick={handleCreateClick}>
                    <Plus className="w-4 h-4 mr-2" /> Create Campaign
                </Button>
            </div>

            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden min-h-[200px] flex flex-col justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p>Loading campaigns...</p>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-white mb-1">No campaigns found</p>
                            <p className="text-sm">Create your first ad campaign to reach more users.</p>
                        </div>
                        <Button className="mt-4 rounded-full bg-white text-black" onClick={handleCreateClick}>
                            Get Started
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 font-medium text-sm text-muted-foreground bg-zinc-900/50">
                            <div className="col-span-4">Campaign Name</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Budget</div>
                            <div className="col-span-2">Results</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-border/50">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-900/30 transition-colors group">
                                    <div className="col-span-4 font-medium">
                                        <div className="flex items-center gap-2">
                                            {campaign.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-normal flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            Started {new Date(campaign.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Badge 
                                            variant="outline" 
                                            className={`
                                                capitalize
                                                ${campaign.status === 'active' || campaign.status === 'Active' ? 'border-green-500/30 text-green-500 bg-green-500/10' : ''}
                                                ${campaign.status === 'paused' || campaign.status === 'Paused' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' : ''}
                                            `}
                                        >
                                            {campaign.status}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2 text-sm">
                                        <div className="font-bold">${campaign.dailyBudget}/day</div>
                                        <div className="text-xs text-muted-foreground">Spent: ${campaign.spend || 0}</div>
                                    </div>
                                    <div className="col-span-2 text-sm">
                                        <div className="font-medium text-blue-500">{campaign.impressions || 0} Reach</div>
                                        <div className="text-xs text-muted-foreground">{campaign.clicks || 0} Clicks</div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-black border-border" align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => toggleStatus(campaign.id, campaign.status)}>
                                                    {campaign.status === 'active' || campaign.status === 'Active' ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Resume</>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(campaign.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
