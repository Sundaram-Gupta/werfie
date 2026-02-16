import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Play, Pause, Plus, Trash2, Edit2, Loader2, Calendar, Megaphone, ExternalLink, Image as ImageIcon } from "lucide-react"
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

export default function AdManager({ onCreateClick }) {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [ads, setAds] = useState([])

    useEffect(() => {
        const fetchAds = async () => {
            try {
                // We'll use the new /creatives endpoint to avoid confusion with the base prefix
                const res = await api.get('/api/ads/creatives');
                setAds(res.data);
            } catch (err) {
                console.error('Fetch error:', err);
                toast.error(err.response?.data?.error || "Failed to fetch ads");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAds();
    }, []);

    const handleCreateClick = () => {
        if (onCreateClick) {
            onCreateClick()
        } else {
            navigate('/ads/create')
        }
    }

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === "active" ? "paused" : "active"
        setAds(ads.map(ad => ad.id === id ? { ...ad, status: newStatus } : ad))
        toast.info(`Ad ${newStatus}`)
    }

    const handleDelete = (id) => {
        setAds(ads.filter(ad => ad.id !== id))
        toast.success("Ad deleted locally")
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Ads</h2>
                    <p className="text-sm text-muted-foreground">Manage individual ad creatives</p>
                </div>
                <Button className="rounded-full bg-white text-black hover:bg-white/90" onClick={handleCreateClick}>
                    <Plus className="w-4 h-4 mr-2" /> Create Ad
                </Button>
            </div>

            <div className="bg-zinc-900/50 border border-border/50 rounded-xl overflow-hidden min-h-[200px] flex flex-col justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p>Loading ads...</p>
                    </div>
                ) : ads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-muted-foreground gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                            <Megaphone className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="font-bold text-white mb-1">No ads found</p>
                            <p className="text-sm">Create an ad creative to start reaching your audience.</p>
                        </div>
                        <Button className="mt-4 rounded-full bg-white text-black" onClick={handleCreateClick}>
                            Create Ad
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 font-medium text-sm text-muted-foreground bg-zinc-900/50">
                            <div className="col-span-1">Preview</div>
                            <div className="col-span-4">Ad Details</div>
                            <div className="col-span-2">Campaign</div>
                            <div className="col-span-1">Status</div>
                            <div className="col-span-2">Results</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-border/50">
                            {ads.map((ad) => (
                                <div key={ad.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-900/30 transition-colors group">
                                    <div className="col-span-1">
                                        <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                                            {ad.mediaUrl ? (
                                                <img src={ad.mediaUrl} alt={ad.headline} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-4 min-w-0">
                                        <div className="font-bold truncate">{ad.headline}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{ad.primaryText}</div>
                                        {ad.destinationUrl && (
                                            <div className="flex items-center gap-1 text-[10px] text-blue-500 mt-1">
                                                <ExternalLink className="w-2.5 h-2.5" />
                                                {new URL(ad.destinationUrl).hostname}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        <div className="truncate">{ad.campaign?.name || 'Untitled'}</div>
                                    </div>
                                    <div className="col-span-1">
                                        <Badge 
                                            variant="outline" 
                                            className={`
                                                capitalize text-[10px]
                                                ${ad.status === 'active' ? 'border-green-500/30 text-green-500 bg-green-500/10' : ''}
                                                ${ad.status === 'paused' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' : ''}
                                            `}
                                        >
                                            {ad.status}
                                        </Badge>
                                    </div>
                                    <div className="col-span-2 text-sm">
                                        <div className="font-medium">{ad.impressions || 0} Imp.</div>
                                        <div className="text-xs text-muted-foreground text-[10px]">{ad.clicks || 0} Clicks</div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-black border-border" align="end">
                                                <DropdownMenuLabel>Ad Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => toggleStatus(ad.id, ad.status)}>
                                                    {ad.status === 'active' ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Resume</>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit2 className="w-4 h-4 mr-2" /> Edit Creative
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-border" />
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(ad.id)}>
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
