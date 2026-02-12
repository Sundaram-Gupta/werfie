import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Building, MapPin, Globe, Mail, Clock, ShieldCheck, Upload } from "lucide-react"
import { businessService } from "@/services/api"
import { toast } from "sonner"

export default function BusinessProfile() {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        email: "",
        website: "",
        location: "",
        hours: ""
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await businessService.getProfile()
                if (data) {
                    setFormData({
                        companyName: data.companyName || "",
                        industry: data.industry || "",
                        email: data.email || "",
                        website: data.website || "",
                        location: data.location || "",
                        hours: data.hours || ""
                    })
                }
            } catch (err) {
                console.error('Failed to fetch business profile:', err)
                // 404 is expected if profile doesn't exist yet
            } finally {
                setFetching(false)
            }
        }
        fetchProfile()
    }, [])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await businessService.updateProfile(formData)
            toast.success("Business profile saved successfully!")
        } catch (err) {
            console.error('Failed to save business profile:', err)
            toast.error(err.response?.data?.error || "Failed to save business profile")
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div className="flex items-center justify-center p-20 text-muted-foreground">Loading business profile...</div>
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Business Profile</h2>
                    <p className="text-sm text-muted-foreground">Manage your public business information</p>
                </div>
                <Button className="rounded-full bg-blue-500 text-white" disabled={loading} onClick={handleSubmit}>
                    {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
            </div>

            <div className="space-y-6">
                {/* Verification Status */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-blue-500">Business Verification</div>
                            <div className="text-xs text-blue-300">Unlock advanced features and build trust.</div>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400">
                        Request Verification
                    </Button>
                </div>

                {/* Main Form */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building className="w-4 h-4 text-muted-foreground" /> Business Name
                        </label>
                        <Input name="companyName" value={formData.companyName} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Acme Corp" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry</label>
                            <Input name="industry" value={formData.industry} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Technology" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" /> Public Email
                            </label>
                            <Input name="email" value={formData.email} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="contact@acme.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" /> Website
                        </label>
                        <Input name="website" value={formData.website} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="https://acme.com" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" /> Location
                        </label>
                        <Input name="location" value={formData.location} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Silicon Valley, CA" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" /> Business Hours
                        </label>
                        <Input name="hours" value={formData.hours} onChange={handleChange} className="bg-zinc-900 border-border" placeholder="Mon-Fri: 9AM - 5PM" />
                    </div>
                </div>

                {/* Branding */}
                <div className="bg-zinc-900/50 border border-border/50 rounded-xl p-6">
                    <h3 className="font-bold mb-4">Branding</h3>
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-zinc-800 rounded-full flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 hover:border-primary cursor-pointer transition-colors">
                            <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Logo</span>
                        </div>
                        <div className="flex-1 h-24 bg-zinc-800 rounded-xl flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 hover:border-primary cursor-pointer transition-colors">
                            <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Banner Image</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
