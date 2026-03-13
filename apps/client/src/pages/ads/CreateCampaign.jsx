import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, ChevronRight, Image as ImageIcon, MapPin, Target, Users, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { mediaService } from "@/services/api"

const ACCEPT_MEDIA = "image/*,video/*"
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export default function CreateCampaign({ onFinish }) {
    const [step, setStep] = useState(1)
    const [isLaunching, setIsLaunching] = useState(false)
    const [adAccount, setAdAccount] = useState(null)
    const [mediaFile, setMediaFile] = useState(null)
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null)
    const [mediaType, setMediaType] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)
    const [formData, setFormData] = useState({
        objective: "",
        name: "",
        budget: "",
        audience: "",
        headline: "",
        description: ""
    })

    useEffect(() => {
        const loadAccount = async () => {
            try {
                const res = await api.get('/api/ads/account');
                const raw = res?.data;
                const account = (raw && typeof raw === 'object' && raw.data !== undefined) ? raw.data : raw;
                if (account && account.id) setAdAccount(account);
            } catch (err) {
                console.error('Failed to fetch ad account', err);
            }
        };
        loadAccount();
    }, []);

    useEffect(() => {
        return () => {
            if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
        };
    }, [mediaPreviewUrl]);

    const setFile = (file) => {
        if (!file) {
            setMediaFile(null);
            if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
            setMediaPreviewUrl(null);
            setMediaType(null);
            return;
        }
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) {
            toast.error("Please select an image or video file.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File is too large. Max 100MB.");
            return;
        }
        if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
        setMediaFile(file);
        setMediaPreviewUrl(URL.createObjectURL(file));
        setMediaType(isImage ? "image" : "video");
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) setFile(file);
        e.target.value = "";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) setFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const objectives = [
        { id: "awareness", label: "Brand Awareness", icon: Users, desc: "Reach the maximum number of people." },
        { id: "traffic", label: "Traffic", icon: Target, desc: "Send people to a destination, like your website." },
        { id: "conversion", label: "Conversions", icon: Check, desc: "Get people to take action." },
    ]

    const nextStep = () => setStep(step + 1)
    const prevStep = () => setStep(step - 1)

    const handleLaunch = async () => {
        let account = adAccount;
        if (!account) {
            try {
                const res = await api.get('/api/ads/account');
                const raw = res?.data;
                account = (raw && typeof raw === 'object' && raw.data !== undefined) ? raw.data : raw;
                if (account) setAdAccount(account);
            } catch (_) {}
        }
        if (!account || !account.id) {
            toast.error("Ad account not ready. Please try again.");
            return;
        }

        setIsLaunching(true);
        try {
            // 1. Create Campaign
            const campaignRes = await api.post('/api/ads/campaigns', {
                adAccountId: account.id,
                name: formData.name || "Untitled Campaign",
                type: formData.objective || "awareness",
                dailyBudget: formData.budget || "0",
                startTime: new Date().toISOString(),
                targeting: { locations: [formData.audience || "Global"] }
            });

            const campaign = campaignRes.data;

            // 2. Upload media if user selected one
            let mediaUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";
            if (mediaFile) {
                try {
                    const uploadResult = await mediaService.uploadMedia(mediaFile);
                    const payload = uploadResult?.data ?? uploadResult;
                    if (payload?.url) mediaUrl = payload.url;
                } catch (upErr) {
                    console.error(upErr);
                    toast.error("Media upload failed. Using default image.");
                }
            }

            // 3. Create Ad Creative
            await api.post('/api/ads/ads', {
                campaign_id: campaign.id,
                ad_name: `${formData.name} Ad`,
                ad_type: mediaType || "image",
                primary_text: formData.description,
                headline: formData.headline,
                media_url: mediaUrl,
                thumbnail_url: null,
                cta_type: "LEARN_MORE",
                destination_url: "https://werfie.com",
                status: "active"
            });

            toast.success("Campaign launched successfully!");
            if (onFinish) onFinish();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message || "Something went wrong";
            toast.error(errorMsg);
        } finally {
            setIsLaunching(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-8 px-10 relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-zinc-800 -z-10" />
                {[1, 2, 3, 4].map((s) => (
                    <div 
                        key={s} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                            step >= s 
                                ? "bg-blue-500 text-white" 
                                : "bg-zinc-900 border border-border text-muted-foreground"
                        }`}
                    >
                        {step > s ? <Check className="w-5 h-5" /> : s}
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-8 min-h-[400px]">
                {/* Step 1: Objective */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Choose your objective</h2>
                            <p className="text-muted-foreground">What do you want to achieve with this campaign?</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {objectives.map((obj) => (
                                <div 
                                    key={obj.id}
                                    onClick={() => setFormData({...formData, objective: obj.id})}
                                    className={`
                                        cursor-pointer p-6 rounded-xl border transition-all text-center
                                        ${formData.objective === obj.id 
                                            ? "bg-blue-500/10 border-blue-500 ring-1 ring-blue-500" 
                                            : "bg-zinc-900 border-border hover:border-zinc-700"}
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${formData.objective === obj.id ? "bg-blue-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                                        <obj.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold mb-1">{obj.label}</h3>
                                    <p className="text-xs text-muted-foreground">{obj.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Details & Audience */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <h2 className="text-2xl font-bold mb-2">Campaign Details</h2>
                            <p className="text-muted-foreground">Define your budget and target audience.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Campaign Name</label>
                                <Input 
                                    placeholder="e.g. Summer Sale 2026" 
                                    className="bg-zinc-900"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Daily Budget</label>
                                <Input 
                                    placeholder="$50.00" 
                                    type="number" 
                                    className="bg-zinc-900"
                                    value={formData.budget}
                                    onChange={e => setFormData({...formData, budget: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Target Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="United States, Canada..." className="bg-zinc-900 pl-9" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Creative */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                         <div>
                            <h2 className="text-2xl font-bold mb-2">Ad Creative</h2>
                            <p className="text-muted-foreground">Design your ad content.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Ad Headline</label>
                                    <Input 
                                        placeholder="Catchy headline..." 
                                        className="bg-zinc-900"
                                        value={formData.headline}
                                        onChange={e => setFormData({...formData, headline: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Ad Text</label>
                                    <Textarea 
                                        placeholder="What's your message?" 
                                        className="bg-zinc-900 min-h-[100px]"
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={ACCEPT_MEDIA}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    className={`border border-dashed rounded-lg p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[180px] ${
                                        isDragging ? "border-blue-500 bg-blue-500/10" : "border-border hover:bg-zinc-900"
                                    }`}
                                >
                                    {mediaPreviewUrl ? (
                                        <div className="relative w-full h-full min-h-[160px] rounded overflow-hidden bg-zinc-900">
                                            {mediaType === "video" ? (
                                                <video src={mediaPreviewUrl} controls className="w-full h-full object-contain max-h-[240px]" />
                                            ) : (
                                                <img src={mediaPreviewUrl} alt="Ad creative" className="w-full h-full object-contain max-h-[240px]" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                                                aria-label="Remove media"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <span className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/60 px-2 py-1 rounded">
                                                Click or drag to replace
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">Upload Image or Video</span>
                                            <span className="text-xs text-muted-foreground/80 mt-1">or drag and drop (max 100MB)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="text-sm font-medium mb-2 block text-muted-foreground">Preview</label>
                                <div className="border border-border rounded-xl p-4 bg-black max-w-sm mx-auto">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600" />
                                        <div>
                                            <div className="font-bold text-sm">Your Business</div>
                                            <div className="text-xs text-muted-foreground">Promoted</div>
                                        </div>
                                    </div>
                                    <div className="text-[15px] mb-3 whitespace-pre-wrap">{formData.description || "Your ad text will appear here..."}</div>
                                    <div className="w-full aspect-video bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden mb-3">
                                        {mediaPreviewUrl ? (
                                            mediaType === "video" ? (
                                                <video src={mediaPreviewUrl} controls className="w-full h-full object-contain" />
                                            ) : (
                                                <img src={mediaPreviewUrl} alt="Ad preview" className="w-full h-full object-contain" />
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">Media Preview</span>
                                        )}
                                    </div>
                                    <div className="bg-zinc-900 p-3 rounded-lg flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">werfie.com</div>
                                        <Button size="sm" className="rounded-full h-8 px-4 font-bold bg-white text-black">Learn More</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                 {/* Step 4: Review */}
                 {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-10">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 mb-6">
                            <Check className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Ready to Launch!</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            Your campaign <span className="text-white font-bold">{formData.name || "Untitled"}</span> is ready to go live with a daily budget of <span className="text-white font-bold">${formData.budget || "0"}</span>.
                        </p>
                        
                        <div className="flex justify-center gap-4">
                            <Button variant="outline" onClick={prevStep} disabled={isLaunching} className="rounded-full h-12 w-32 border-border">Back</Button>
                            <Button 
                                onClick={handleLaunch}
                                disabled={isLaunching}
                                className="rounded-full h-12 w-48 font-bold bg-blue-500 hover:bg-blue-600 text-lg shadow-lg shadow-blue-500/20"
                            >
                                {isLaunching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Launch Campaign"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons (Steps 1-3) */}
            {step < 4 && (
                <div className="flex justify-between mt-8">
                    <Button 
                        variant="ghost" 
                        onClick={prevStep} 
                        disabled={step === 1}
                        className="text-muted-foreground hover:text-white"
                    >
                        Back
                    </Button>
                    <Button 
                        onClick={nextStep} 
                        className="bg-white text-black hover:bg-white/90 rounded-full px-8 font-bold"
                        disabled={step === 1 && !formData.objective}
                    >
                        {step === 3 ? "Review" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    )
}
