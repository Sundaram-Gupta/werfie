import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, ExternalLink, RefreshCw, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { getInstitutionalProfiles, reviewInstitutionalProfile } from '@/services/verificationService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Mail, Phone, MapPin, Globe, Building2, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function VerificationPage() {
    const [loading, setLoading] = useState(false);
    const [institutionalRequests, setInstitutionalRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    // Original mock data for standard user verifications (can be replaced with API later)
    const [standardRequests, setStandardRequests] = useState([
        { id: 1, user: '@elon_musk_parody', name: 'Elon Musk (Parody)', type: 'Government ID', date: '2024-01-16', status: 'Pending', doc: 'passport.jpg' },
        { id: 2, user: '@official_nike', name: 'Nike Official', type: 'Business License', date: '2024-01-15', status: 'Pending', doc: 'license.pdf' },
        { id: 3, user: '@john_smith', name: 'John Smith', type: 'Government ID', date: '2024-01-14', status: 'Rejected', doc: 'id_card.png' },
        { id: 4, user: '@tech_crunch', name: 'TechCrunch', type: 'Domain Verification', date: '2024-01-12', status: 'Approved', doc: 'dns_record.txt' },
        { id: 5, user: '@random_user_99', name: 'Random User', type: 'Government ID', date: '2024-01-10', status: 'Pending', doc: 'selfie.jpg' },
    ]);

    const fetchInstitutional = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getInstitutionalProfiles();
            setInstitutionalRequests(data);
        } catch (error) {
            toast.error('Failed to fetch institutional requests');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInstitutional();
    }, [fetchInstitutional]);

    const handleStandardAction = (id, action) => {
        setStandardRequests(standardRequests.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'Approved' : 'Rejected' } : r));
        toast.success(`Verification request ${action === 'approve' ? 'approved' : 'rejected'}`);
    };

    const handleInstitutionalAction = async (id, status) => {
        try {
            await reviewInstitutionalProfile(id, { 
                status, 
                badgeType: status === 'approved' ? 'official' : null 
            });
            toast.success(`Institutional request ${status === 'approved' ? 'approved' : 'rejected'}`);
            fetchInstitutional();
        } catch (error) {
            toast.error('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Verification Requests</h1>
                    <p className="text-muted-foreground mt-1">Review and manage verification badges for users and institutions.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchInstitutional} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-muted/50 border border-border">
                    <TabsTrigger value="pending">Standard Requests</TabsTrigger>
                    <TabsTrigger value="institutional">Institutional Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Standard Pending Requests</CardTitle>
                            <CardDescription className="text-muted-foreground">Queue of individual accounts requesting verification.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-muted-foreground">User</TableHead>
                                        <TableHead className="text-muted-foreground">Name</TableHead>
                                        <TableHead className="text-muted-foreground">Type</TableHead>
                                        <TableHead className="text-muted-foreground">Date</TableHead>
                                        <TableHead className="text-muted-foreground">Evidence</TableHead>
                                        <TableHead className="text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {standardRequests.map((req) => (
                                        <TableRow key={req.id} className="border-border hover:bg-muted/50">
                                            <TableCell className="font-medium text-foreground">{req.user}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.type}</TableCell>
                                            <TableCell className="text-muted-foreground">{req.date}</TableCell>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                    {req.doc} <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`
                                                        ${req.status === 'Approved' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                                                        ${req.status === 'Rejected' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : ''}
                                                        ${req.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : ''}
                                                        border-none
                                                    `}
                                                >
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {req.status === 'Pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                            onClick={() => handleStandardAction(req.id, 'approve')}
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => handleStandardAction(req.id, 'reject')}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="institutional" className="mt-6">
                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Institutional Approval Requests</CardTitle>
                            <CardDescription className="text-muted-foreground">Requests from governments, ministries, and official organizations.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-muted-foreground">Institution</TableHead>
                                        <TableHead className="text-muted-foreground">Type</TableHead>
                                        <TableHead className="text-muted-foreground">Country</TableHead>
                                        <TableHead className="text-muted-foreground">Representative</TableHead>
                                        <TableHead className="text-muted-foreground">Docs</TableHead>
                                        <TableHead className="text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {institutionalRequests.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                {loading ? 'Loading requests...' : 'No institutional requests found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        institutionalRequests.map((req) => (
                                            <TableRow key={req.id} className="border-border hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground">{req.institutionName}</span>
                                                        <span className="text-xs text-muted-foreground">{req.website}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">{req.institutionType}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{req.country || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span>{req.repFullName}</span>
                                                        <span className="text-muted-foreground italic">{req.repJobTitle}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {req.repIdUrl && (
                                                            <a href={req.repIdUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                        {req.repAuthLetterUrl && (
                                                            <a href={req.repAuthLetterUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                                                                <Landmark className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`
                                                            ${req.status === 'approved' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                                                            ${req.status === 'rejected' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : ''}
                                                            ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : ''}
                                                            ${req.status === 'under_review' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : ''}
                                                            border-none
                                                        `}
                                                    >
                                                        {req.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedRequest(req);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                        >
                                                            View Details
                                                        </Button>
                                                        {req.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleInstitutionalAction(req.id, 'approved');
                                                                    }}
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleInstitutionalAction(req.id, 'rejected');
                                                                    }}
                                                                    title="Reject"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Institutional Request Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-card border-border">
                    <DialogHeader className="p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-4">
                            {selectedRequest?.logoUrl ? (
                                <img src={selectedRequest.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-cover border border-border" />
                            ) : (
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                            )}
                            <div>
                                <DialogTitle className="text-2xl font-bold text-foreground">
                                    {selectedRequest?.institutionName}
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="capitalize">{selectedRequest?.institutionType}</Badge>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="flex items-center gap-1 text-xs"><Globe className="h-3 w-3" /> {selectedRequest?.website}</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" /> {selectedRequest?.country}{selectedRequest?.state ? `, ${selectedRequest.state}` : ''}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="h-full max-h-[calc(90vh-140px)]">
                        <div className="p-6">
                            <Tabs defaultValue="institution" className="w-full">
                                <TabsList className="bg-muted/50 w-full justify-start border-b border-border rounded-none p-0 h-auto mb-6">
                                    <TabsTrigger value="institution" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4 h-auto">Organization</TabsTrigger>
                                    <TabsTrigger value="representative" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4 h-auto">Representative</TabsTrigger>
                                    <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4 h-auto">Documents</TabsTrigger>
                                    <TabsTrigger value="public" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4 h-auto">Public Profile</TabsTrigger>
                                    <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2 px-4 h-auto">Security & Settings</TabsTrigger>
                                </TabsList>

                                <TabsContent value="institution" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution Name</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.institutionName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution Type</span>
                                            <p className="text-foreground font-medium capitalize">{selectedRequest?.institutionType}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Official Website</span>
                                            <a href={selectedRequest?.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-medium">
                                                {selectedRequest?.website} <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Official Email Domain</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.officialEmailDomain || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.country || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">State/Region</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.state || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</span>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{selectedRequest?.description || 'No description provided.'}</p>
                                    </div>
                                    {selectedRequest?.bannerUrl && (
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Banner</span>
                                            <img src={selectedRequest.bannerUrl} alt="Banner" className="w-full h-32 object-cover rounded-lg border border-border mt-2" />
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="representative" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</span>
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-foreground font-medium">{selectedRequest?.repFullName}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Title</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.repJobTitle}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.repDepartment || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Official Email</span>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-foreground font-medium">{selectedRequest?.repOfficialEmail}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</span>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-foreground font-medium">{selectedRequest?.repPhone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LinkedIn Profile</span>
                                            {selectedRequest?.repLinkedInUrl ? (
                                                <a href={selectedRequest.repLinkedInUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-medium">
                                                    View Profile <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <p className="text-muted-foreground">Not provided</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="documents" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <Card className="bg-muted/20 border-border overflow-hidden">
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm">Identity Document</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                {selectedRequest?.repIdUrl ? (
                                                    <div className="space-y-3">
                                                        <div className="h-40 w-full bg-black rounded border border-border flex items-center justify-center overflow-hidden">
                                                            {typeof selectedRequest.repIdUrl === 'string' && selectedRequest.repIdUrl.toLowerCase().endsWith('.pdf') ? (
                                                                <FileText className="h-12 w-12 text-muted-foreground" />
                                                            ) : (
                                                                <img src={selectedRequest.repIdUrl} alt="ID" className="max-h-full max-w-full object-contain" />
                                                            )}
                                                        </div>
                                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                                            <a href={selectedRequest.repIdUrl} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="h-3 w-3 mr-2" /> View Full Document
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : <p className="text-muted-foreground text-sm italic">Not provided</p>}
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-muted/20 border-border overflow-hidden">
                                            <CardHeader className="p-4 pb-0">
                                                <CardTitle className="text-sm">Authorization Letter</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-4">
                                                {selectedRequest?.repAuthLetterUrl ? (
                                                    <div className="space-y-3">
                                                        <div className="h-40 w-full bg-black rounded border border-border flex items-center justify-center overflow-hidden">
                                                            {typeof selectedRequest.repAuthLetterUrl === 'string' && selectedRequest.repAuthLetterUrl.toLowerCase().endsWith('.pdf') ? (
                                                                <FileText className="h-12 w-12 text-muted-foreground" />
                                                            ) : (
                                                                <img src={selectedRequest.repAuthLetterUrl} alt="Auth Letter" className="max-h-full max-w-full object-contain" />
                                                            )}
                                                        </div>
                                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                                            <a href={selectedRequest.repAuthLetterUrl} target="_blank" rel="noreferrer">
                                                                <ExternalLink className="h-3 w-3 mr-2" /> View Full Document
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : <p className="text-muted-foreground text-sm italic">Not provided</p>}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {selectedRequest?.supportingDocs && Array.isArray(selectedRequest.supportingDocs) && selectedRequest.supportingDocs.length > 0 && (
                                        <div className="space-y-3">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supporting Documents</span>
                                            <div className="grid grid-cols-3 gap-4">
                                                {selectedRequest.supportingDocs.map((doc, idx) => {
                                                    const docUrl = typeof doc === 'string' ? doc : (doc?.url || "");
                                                    const docName = typeof doc === 'string' ? `Doc ${idx + 1}` : (doc?.name || `Doc ${idx + 1}`);
                                                    const isPdf = typeof docUrl === 'string' && docUrl.toLowerCase().endsWith('.pdf');

                                                    return (
                                                        <a key={idx} href={docUrl} target="_blank" rel="noreferrer" className="group">
                                                            <div className="h-24 w-full bg-muted/30 rounded border border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                                                                {isPdf ? (
                                                                    <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                                                                ) : (
                                                                    docUrl ? (
                                                                        <img src={docUrl} alt={docName} className="max-h-full max-w-full object-cover" />
                                                                    ) : (
                                                                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                                                                    )
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-center mt-1 text-muted-foreground group-hover:text-primary truncate">{docName}</p>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="public" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Public Display Name</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.publicDisplayName || selectedRequest?.institutionName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Headquarters</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.headquarters || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Public Bio</span>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{selectedRequest?.publicBio || 'No public bio set.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedRequest?.categories && selectedRequest.categories.length > 0 ? (
                                                    selectedRequest.categories.map((cat, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-[10px]">{cat}</Badge>
                                                    ))
                                                ) : <span className="text-muted-foreground text-xs">None</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Languages</span>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {selectedRequest?.languages && selectedRequest.languages.length > 0 ? (
                                                    selectedRequest.languages.map((lang, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-[10px]">{lang}</Badge>
                                                    ))
                                                ) : <span className="text-muted-foreground text-xs">None</span>}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="security" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className={`h-5 w-5 ${selectedRequest?.twoFactorEnabled ? 'text-green-500' : 'text-muted-foreground'}`} />
                                                <div>
                                                    <p className="font-medium text-sm">2FA Security</p>
                                                    <p className="text-xs text-muted-foreground">{selectedRequest?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Role</span>
                                            <p className="text-foreground font-medium capitalize">{selectedRequest?.primaryRole || 'Publisher'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recovery Email</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.recoveryEmail || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recovery Phone</span>
                                            <p className="text-foreground font-medium">{selectedRequest?.recoveryPhone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <p className="text-xs text-blue-400 font-medium">Transparency & Terms</p>
                                        <div className="flex gap-4 mt-2">
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className={`h-3 w-3 ${selectedRequest?.transparencyAccepted ? 'text-green-500' : 'text-muted-foreground'}`} />
                                                <span className="text-[10px] text-muted-foreground">Transparency Accepted</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle className={`h-3 w-3 ${selectedRequest?.termsAccepted ? 'text-green-500' : 'text-muted-foreground'}`} />
                                                <span className="text-[10px] text-muted-foreground">Terms Accepted</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t border-border bg-muted/10">
                        {selectedRequest?.status === 'pending' ? (
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 flex-1 sm:flex-none"
                                    onClick={() => {
                                        handleInstitutionalAction(selectedRequest.id, 'rejected');
                                        setIsDetailsOpen(false);
                                    }}
                                >
                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                                    onClick={() => {
                                        handleInstitutionalAction(selectedRequest.id, 'approved');
                                        setIsDetailsOpen(false);
                                    }}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

