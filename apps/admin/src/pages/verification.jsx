import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, ExternalLink, RefreshCw, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { getInstitutionalProfiles, reviewInstitutionalProfile } from '@/services/verificationService';

export default function VerificationPage() {
    const [loading, setLoading] = useState(false);
    const [institutionalRequests, setInstitutionalRequests] = useState([]);
    
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
                                                    {req.status === 'pending' && (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                                onClick={() => handleInstitutionalAction(req.id, 'approved')}
                                                                title="Approve"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleInstitutionalAction(req.id, 'rejected')}
                                                                title="Reject"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
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
        </div>
    );
}

