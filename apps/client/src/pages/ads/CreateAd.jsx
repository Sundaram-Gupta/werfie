import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Megaphone, Image as ImageIcon, Video, Type } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

export default function CreateAd({ onFinish, onBack }) {
    const [isLoading, setIsLoading] = useState(false)
    const [campaigns, setCampaigns] = useState([])
    const [isFetchingCampaigns, setIsFetchingCampaigns] = useState(true)
    
    const [formData, setFormData] = useState({
        ad_name: "",
        campaign_id: "",
        ad_type: "image", // image, video, text
        primary_text: "",
        headline: "",
        media_url: "",
        thumbnail_url: "",
        cta_type: "LEARN_MORE", // LEARN_MORE, INSTALL, SIGN_UP, SHOP_NOW
        destination_url: "",
        status: "active"
    })

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/api/ads/campaigns');
                setCampaigns(res.data);
                if (res.data.length > 0) {
                    setFormData(prev => ({ ...prev, campaign_id: res.data[0].id }));
                }
            } catch (err) {
                console.error('Failed to fetch campaigns:', err);
                toast.error("Failed to load campaigns. Please create a campaign first.");
            } finally {
                setIsFetchingCampaigns(false);
            }
        };
        fetchCampaigns();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.campaign_id) {
            toast.error("Please select a campaign")
            return
        }

        setIsLoading(true)
        try {
            await api.post('/api/ads/ads', formData)
            toast.success("Ad creative created successfully!")
            if (onFinish) onFinish()
        } catch (err) {
            console.error('Create ad error:', err)
            toast.error(err.response?.data?.error || "Failed to create ad")
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetchingCampaigns) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
        )
    }

    if (campaigns.length === 0) {
        return (
            <div className="text-center py-20 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-blue-500">
                    <Megaphone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">No Campaigns Found</h3>
                <p className="text-muted-foreground italic text-sm">
                    You need to create at least one campaign before you can create an ad creative.
                </p>
                <Button onClick={onBack} variant="outline" className="rounded-full">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Create Ad Creative</h2>
                    <p className="text-sm text-muted-foreground">Enter the details for your new advertisement</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/30 p-8 rounded-2xl border border-border/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ad Name <span className="text-red-500">*</span></label>
                            <Input 
                                name="ad_name" 
                                value={formData.ad_name} 
                                onChange={handleChange} 
                                placeholder="Summer Sale Ad #1" 
                                required
                                className="bg-black border-border/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Campaign <span className="text-red-500">*</span></label>
                            <select 
                                name="campaign_id"
                                value={formData.campaign_id}
                                onChange={handleChange}
                                className="w-full h-10 px-3 py-2 bg-black border border-border/50 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            >
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Ad Type */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Ad Type <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'image', icon: ImageIcon, label: 'Image' },
                                { id: 'video', icon: Video, label: 'Video' },
                                { id: 'text', icon: Type, label: 'Text' },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, ad_type: type.id }))}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2",
                                        formData.ad_type === type.id 
                                            ? "border-blue-500 bg-blue-500/10 text-blue-500" 
                                            : "border-border/50 bg-black text-muted-foreground hover:border-border"
                                    )}
                                >
                                    <type.icon className="w-6 h-6" />
                                    <span className="text-xs font-bold">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Creative Content */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Primary Text <span className="text-red-500">*</span></label>
                        <Textarea 
                            name="primary_text" 
                            value={formData.primary_text} 
                            onChange={handleChange} 
                            placeholder="What do you want to say to your audience?" 
                            required
                            className="bg-black border-border/50 min-h-[100px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Headline</label>
                            <Input 
                                name="headline" 
                                value={formData.headline} 
                                onChange={handleChange} 
                                placeholder="Enter a catchy headline" 
                                className="bg-black border-border/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">CTA Type</label>
                            <select 
                                name="cta_type"
                                value={formData.cta_type}
                                onChange={handleChange}
                                className="w-full h-10 px-3 py-2 bg-black border border-border/50 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="LEARN_MORE">Learn More</option>
                                <option value="INSTALL">Install Now</option>
                                <option value="SIGN_UP">Sign Up</option>
                                <option value="SHOP_NOW">Shop Now</option>
                                <option value="BOOK_NOW">Book Now</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Media and Destination */}
                <div className="space-y-4 pt-4 border-t border-border/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Media URL</label>
                            <Input 
                                name="media_url" 
                                value={formData.media_url} 
                                onChange={handleChange} 
                                placeholder="https://example.com/image.jpg" 
                                className="bg-black border-border/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Destination URL</label>
                            <Input 
                                name="destination_url" 
                                value={formData.destination_url} 
                                onChange={handleChange} 
                                placeholder="https://yourwebsite.com/landing" 
                                className="bg-black border-border/50"
                            />
                        </div>
                    </div>

                    {formData.ad_type === 'video' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Video Thumbnail URL</label>
                            <Input 
                                name="thumbnail_url" 
                                value={formData.thumbnail_url} 
                                onChange={handleChange} 
                                placeholder="https://example.com/thumb.jpg" 
                                className="bg-black border-border/50"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="ghost" onClick={onBack} className="rounded-full px-6">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="rounded-full px-8 bg-blue-500 hover:bg-blue-600 text-white font-bold">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Ad
                    </Button>
                </div>
            </form>
        </div>
    )
}
