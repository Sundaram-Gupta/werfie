import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
    ArrowLeft, Loader2, Save, Building2, CheckCircle2, 
    UserCircle, ShieldCheck, LayoutPanelLeft, Globe, 
    Upload, Trash2, Mail, ExternalLink, ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { institutionalService } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

const STEPS = [
    { id: 1, title: "Organization", icon: Building2 },
    { id: 2, title: "Representative", icon: UserCircle },
    { id: 3, title: "Security & Access", icon: ShieldAlert },
    { id: 4, title: "Trust & Verification", icon: ShieldCheck },
    { id: 5, title: "Public Profile", icon: LayoutPanelLeft },
    { id: 6, title: "Review", icon: CheckCircle2 }
]

export default function InstitutionalSetup() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [formData, setFormData] = useState({
        // 1. Basic Info
        institutionName: "",
        institutionType: "government",
        country: "",
        state: "",
        website: "",
        officialEmailDomain: "",
        description: "",
        logoUrl: "",
        bannerUrl: "",
        
        // 2. Representative
        repFullName: "",
        repJobTitle: "",
        repDepartment: "",
        repOfficialEmail: "",
        repPhone: "",
        repIdUrl: "",
        repLinkedInUrl: "",
        repAuthLetterUrl: "",

        // 3. Security & Access
        twoFactorEnabled: false,
        primaryRole: "publisher",
        recoveryEmail: "",
        recoveryPhone: "",

        // 4. Verification
        supportingDocs: [], // { name: string, url: string }
        transparencyAccepted: false,
        termsAccepted: false,

        // 5. Public Profile
        publicDisplayName: "",
        publicBio: "",
        headquarters: "",
        categories: [],
        languages: []
    })

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await institutionalService.getProfile()
                if (data) {
                    setFormData(prev => ({ ...prev, ...data }))
                }
            } catch (err) {
                console.error("Failed to load institutional profile", err)
            } finally {
                setFetching(false)
            }
        }
        loadProfile()
    }, [])

    const handleSave = async () => {
        setLoading(true)
        try {
            await institutionalService.updateProfile(formData)
            toast.success("Progress saved successfully!")
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to save progress")
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6))
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

    const handleFileUpload = async (file, type, targetField = null) => {
        try {
            const data = await institutionalService.uploadDocument(file, type)
            if (targetField) {
                setFormData(prev => ({ ...prev, [targetField]: data.url }))
            } else if (type === 'supporting') {
                setFormData(prev => ({
                    ...prev,
                    supportingDocs: [...(prev.supportingDocs || []), { name: file.name, url: data.url }]
                }))
            }
            toast.success("Document uploaded successfully")
        } catch (err) {
            console.error("Upload error:", err)
            toast.error("Failed to upload document")
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="flex items-center gap-4">
                    <div onClick={() => navigate(-1)} className="cursor-pointer hover:bg-muted/50 p-2 rounded-full transition">
                        <ArrowLeft className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-[20px] font-bold leading-6">Sovereign Institutional Setup</h1>
                        <span className="text-[13px] text-muted-foreground">Verification & Trust Framework</span>
                    </div>
                </div>
                <Button onClick={handleSave} variant="ghost" className="rounded-full gap-2 text-primary" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Progress
                </Button>
            </div>

            {/* Stepper */}
            <div className="px-6 py-8 border-b border-border/30">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    {STEPS.map((step, idx) => (
                        <div key={step.id} className="flex flex-col items-center gap-2 relative">
                            <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                <step.icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[11px] font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                {step.title}
                            </span>
                            {idx < STEPS.length - 1 && (
                                <div className={`absolute top-5 left-[calc(100%+8px)] w-[calc(100%-16px)] h-[1px] ${
                                    currentStep > step.id ? 'bg-primary' : 'bg-border'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {currentStep === 1 && <OrganizationForm formData={formData} setFormData={setFormData} onUpload={handleFileUpload} />}
                {currentStep === 2 && <RepresentativeForm formData={formData} setFormData={setFormData} onUpload={handleFileUpload} />}
                {currentStep === 3 && <SecurityForm formData={formData} setFormData={setFormData} />}
                {currentStep === 4 && <TrustForm formData={formData} setFormData={setFormData} onUpload={handleFileUpload} />}
                {currentStep === 5 && <PublicProfileForm formData={formData} setFormData={setFormData} onUpload={handleFileUpload} />}
                {currentStep === 6 && <ReviewStep formData={formData} />}

                <div className="flex items-center justify-between pt-10">
                    <Button 
                        variant="outline" 
                        onClick={prevStep} 
                        disabled={currentStep === 1}
                        className="rounded-full px-8"
                    >
                        Back
                    </Button>
                    <Button 
                        onClick={currentStep === 6 ? handleSave : nextStep} 
                        className="rounded-full px-8"
                    >
                        {currentStep === 6 ? "Submit Application" : "Continue"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function OrganizationForm({ formData, setFormData, onUpload }) {
    const institutionTypes = [
        "Government", "Ministry", "Central Bank", "Public Agency", 
        "International Organization", "Emergency Authority", "Other"
    ]

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Basic Institution Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Official Legal Name</label>
                    <Input 
                        placeholder="e.g. Ministry of Sovereign Affairs" 
                        value={formData.institutionName}
                        onChange={e => setFormData({ ...formData, institutionName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Institution Type</label>
                    <select 
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        value={formData.institutionType}
                        onChange={e => setFormData({ ...formData, institutionType: e.target.value })}
                    >
                        {institutionTypes.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Official Website</label>
                    <Input 
                        placeholder="https://www.agency.gov" 
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Country</label>
                    <Input 
                        placeholder="United Arab Emirates" 
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">State / Region</label>
                    <Input 
                        placeholder="Abu Dhabi" 
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                    />
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">About the Institution</label>
                    <Textarea 
                        placeholder="Provide a brief overview of your organization's mission..." 
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div className="col-span-1">
                    <label className="text-sm font-medium mb-1.5 block">Institution Logo</label>
                    <div className="flex items-center gap-4">
                        {formData.logoUrl && <img src={formData.logoUrl} className="w-12 h-12 rounded-lg object-cover border" alt="Logo" />}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="relative overflow-hidden"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={e => onUpload(e.target.files[0], 'logo', 'logoUrl')}
                            />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function RepresentativeForm({ formData, setFormData, onUpload }) {
    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-primary" />
                Authorized Representative Details
            </h2>
            <p className="text-sm text-muted-foreground">Details of the primary individual applying on behalf of the institution.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <Input 
                        placeholder="Dr. Sarah Johnson" 
                        value={formData.repFullName}
                        onChange={e => setFormData({ ...formData, repFullName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Job Title / Role</label>
                    <Input 
                        placeholder="Director of Communications" 
                        value={formData.repJobTitle}
                        onChange={e => setFormData({ ...formData, repJobTitle: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Department</label>
                    <Input 
                        placeholder="Public Relations" 
                        value={formData.repDepartment}
                        onChange={e => setFormData({ ...formData, repDepartment: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Official Email Address</label>
                    <Input 
                        type="email" 
                        placeholder="sarah.j@agency.gov" 
                        value={formData.repOfficialEmail}
                        onChange={e => setFormData({ ...formData, repOfficialEmail: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                    <Input 
                        type="tel" 
                        placeholder="+1 (555) 000-0000" 
                        value={formData.repPhone}
                        onChange={e => setFormData({ ...formData, repPhone: e.target.value })}
                    />
                </div>
                <div className="col-span-2 space-y-4">
                    <div className="p-4 border border-dashed rounded-xl space-y-3">
                        <label className="text-sm font-bold flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Representative Identity Document
                        </label>
                        <p className="text-xs text-muted-foreground">Passport or National ID for verification.</p>
                        <div className="flex items-center gap-3">
                            {formData.repIdUrl ? (
                                <>
                                    <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3" />
                                        File Uploaded
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setFormData({...formData, repIdUrl: ""})}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" className="relative">
                                    Browse File
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={e => onUpload(e.target.files[0], 'rep_id', 'repIdUrl')}
                                    />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border border-dashed rounded-xl space-y-3">
                        <label className="text-sm font-bold flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Official Authorization Letter
                        </label>
                        <p className="text-xs text-muted-foreground">Certified letter authorizing you to represent the institution.</p>
                        <div className="flex items-center gap-3">
                            {formData.repAuthLetterUrl ? (
                                <>
                                    <div className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3" />
                                        File Uploaded
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setFormData({...formData, repAuthLetterUrl: ""})}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" className="relative">
                                    Browse File
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={e => onUpload(e.target.files[0], 'auth_letter', 'repAuthLetterUrl')}
                                    />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SecurityForm({ formData, setFormData }) {
    const roles = ["Publisher", "Editor", "Viewer", "Admin"]

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Account Credentials & Access Control
            </h2>
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                    <div>
                        <p className="text-sm font-bold">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <input 
                        type="checkbox"
                        className="w-5 h-5 accent-primary"
                        checked={formData.twoFactorEnabled}
                        onChange={e => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Primary Account Role</label>
                        <select 
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                            value={formData.primaryRole}
                            onChange={e => setFormData({ ...formData, primaryRole: e.target.value })}
                        >
                            {roles.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                        </select>
                    </div>
                    <div className="hidden md:block" />
                    
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Recovery Email</label>
                        <Input 
                            type="email"
                            placeholder="recovery@agency.gov" 
                            value={formData.recoveryEmail}
                            onChange={e => setFormData({ ...formData, recoveryEmail: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Recovery Phone</label>
                        <Input 
                            type="tel"
                            placeholder="+1 (555) 000-0000" 
                            value={formData.recoveryPhone}
                            onChange={e => setFormData({ ...formData, recoveryPhone: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function TrustForm({ formData, setFormData, onUpload }) {
    const [domainLoading, setDomainLoading] = useState(false)
    const [verified, setVerified] = useState(formData.isDomainVerified)

    const handleVerifyPortal = async () => {
        setDomainLoading(true)
        try {
            await institutionalService.verifyDomain()
            setVerified(true)
            toast.success("Domain verified successfully!")
        } catch (err) {
            toast.error("Verification failed")
        } finally {
            setDomainLoading(false)
        }
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Trust & Verification Information
            </h2>

            {/* Domain Verification */}
            <div className={`p-4 rounded-xl border ${verified ? 'bg-green-500/10 border-green-500/20' : 'bg-muted/50 border-border'}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Mail className={`w-5 h-5 ${verified ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <div>
                            <p className="text-sm font-bold">Official Domain Verification</p>
                            <p className="text-xs text-muted-foreground">Verify ownership via an official @agency.gov email</p>
                        </div>
                    </div>
                    {verified ? (
                        <div className="flex items-center gap-1 text-green-500 text-xs font-bold bg-green-500/20 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            VERIFIED
                        </div>
                    ) : (
                        <Button size="sm" onClick={handleVerifyPortal} disabled={domainLoading}>
                            {domainLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Now"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Document Upload Implementation */}
            <div className="space-y-4">
                <p className="text-sm font-bold">Supporting Documents</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["Govt Certificate", "Registration Proof", "Authorization Letter"].map(docType => {
                        const existing = formData.supportingDocs?.find(d => d.name === docType || d.type === docType);
                        return (
                            <div key={docType} className={`flex flex-col gap-2 p-4 border border-dashed rounded-lg items-center justify-center transition ${
                                existing ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/30 cursor-pointer'
                            } relative`}>
                                {existing ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                        <span className="text-[11px] font-bold text-primary">{docType}</span>
                                        <button 
                                            onClick={() => setFormData({
                                                ...formData,
                                                supportingDocs: formData.supportingDocs.filter(d => d !== existing)
                                            })}
                                            className="absolute top-2 right-2 p-1 hover:bg-destructive/10 rounded-full"
                                        >
                                            <Trash2 className="w-3 h-3 text-destructive" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-[11px] font-medium">{docType}</span>
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            onChange={e => onUpload(e.target.files[0], 'supporting')}
                                        />
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
                {formData.supportingDocs?.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-bold mb-2 uppercase">Uploaded Files:</p>
                        <div className="space-y-1">
                            {formData.supportingDocs.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px]">
                                    <span className="truncate max-w-[200px]">{doc.name}</span>
                                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Transparency Toggles */}
            <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        className="mt-1"
                        checked={formData.transparencyAccepted}
                        onChange={e => setFormData({ ...formData, transparencyAccepted: e.target.checked })}
                    />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transparency Declaration</p>
                        <p className="text-[13px]">I declare that all information provided is accurate and I am legally authorized to register this institution.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PublicProfileForm({ formData, setFormData, onUpload }) {
    const categories = ["Economy", "Health", "Defense", "Climate", "Infrastructure", "Finance"]

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutPanelLeft className="w-5 h-5 text-primary" />
                Public Profile Settings
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Public Display Name</label>
                    <Input 
                        placeholder="e.g. Health Authority of Abu Dhabi" 
                        value={formData.publicDisplayName}
                        onChange={e => setFormData({ ...formData, publicDisplayName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Public Bio</label>
                    <Textarea 
                        placeholder="Official information and announcements for the public." 
                        value={formData.publicBio}
                        onChange={e => setFormData({ ...formData, publicBio: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Profile Banner</label>
                    <div className="relative h-32 w-full rounded-xl border border-dashed flex items-center justify-center overflow-hidden bg-muted/20">
                        {formData.bannerUrl ? (
                            <>
                                <img src={formData.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                                    <Button size="sm" variant="secondary" className="relative">
                                        Change Banner
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                            onChange={e => onUpload(e.target.files[0], 'banner', 'bannerUrl')}
                                        />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => setFormData({...formData, bannerUrl: ""})}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                                <span className="text-xs font-medium">Upload Banner Image</span>
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={e => onUpload(e.target.files[0], 'banner', 'bannerUrl')}
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium mb-2 block">Categories / Topics</p>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <div 
                                key={cat}
                                onClick={() => {
                                    const cats = formData.categories || []
                                    const newCats = cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
                                    setFormData({ ...formData, categories: newCats })
                                }}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer transition ${
                                    formData.categories?.includes(cat) ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                                }`}
                            >
                                {cat}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ReviewStep({ formData }) {
    return (
        <div className="space-y-8 max-w-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Final Review
            </h2>
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 divide-y divide-border/30">
                <div className="pb-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Institution</p>
                    <p className="font-bold text-lg">{formData.institutionName || "(Not set)"}</p>
                    <p className="text-sm text-muted-foreground">{formData.institutionType} • {formData.country}</p>
                </div>
                <div className="py-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Representative</p>
                    <p className="font-medium">{formData.repFullName || "(Not set)"}</p>
                    <p className="text-sm text-muted-foreground">{formData.repJobTitle} • {formData.repOfficialEmail}</p>
                </div>
                <div className="py-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Trust Status</p>
                    <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${formData.isDomainVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm font-medium">{formData.isDomainVerified ? 'Domain Verified' : 'Domain Verification Pending'}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-4">
                <ShieldAlert className="w-6 h-6 text-primary shrink-0" />
                <p className="text-[13px] leading-relaxed">
                    By submitting this application, you agree that your institutional profile will undergo manual review by the Werfie Trust & Safety team. Verification badges are issued solely at the platform's discretion.
                </p>
            </div>
        </div>
    )
}
