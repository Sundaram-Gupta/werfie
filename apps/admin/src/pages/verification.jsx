import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function VerificationPage() {
    const [requests, setRequests] = useState([
        { id: 1, user: '@elon_musk_parody', name: 'Elon Musk (Parody)', type: 'Government ID', date: '2024-01-16', status: 'Pending', doc: 'passport.jpg' },
        { id: 2, user: '@official_nike', name: 'Nike Official', type: 'Business License', date: '2024-01-15', status: 'Pending', doc: 'license.pdf' },
        { id: 3, user: '@john_smith', name: 'John Smith', type: 'Government ID', date: '2024-01-14', status: 'Rejected', doc: 'id_card.png' },
        { id: 4, user: '@tech_crunch', name: 'TechCrunch', type: 'Domain Verification', date: '2024-01-12', status: 'Approved', doc: 'dns_record.txt' },
        { id: 5, user: '@random_user_99', name: 'Random User', type: 'Government ID', date: '2024-01-10', status: 'Pending', doc: 'selfie.jpg' },
    ]);

    const handleAction = (id, action) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: action === 'approve' ? 'Approved' : 'Rejected' } : r));
        toast.success(`Verification request ${action === 'approve' ? 'approved' : 'rejected'}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Verification Requests</h1>
                <p className="text-muted-foreground mt-1">Review and manage accumulated verification requests from users.</p>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                    <CardDescription className="text-muted-foreground">Queue of accounts requesting verification badges.</CardDescription>
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
                            {requests.map((req) => (
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
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleAction(req.id, 'reject')}
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
        </div>
    );
}
