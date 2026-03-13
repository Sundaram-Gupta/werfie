import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AppealsPage() {
    const [appeals, setAppeals] = useState([
        { id: 1, user: '@john_doe', type: 'Account Suspension', reason: 'Violation of hate speech policy', date: '2024-01-15', status: 'Pending' },
        { id: 2, user: '@crypto_king', type: 'Post Removal', reason: 'Spam / Scam', date: '2024-01-14', status: 'Rejected' },
        { id: 3, user: '@art_lover', type: 'Copyright Strike', reason: 'Disputed ownership', date: '2024-01-12', status: 'Approved' },
        { id: 4, user: '@news_daily', type: 'Shadowban', reason: 'Automated flag error', date: '2024-01-10', status: 'Pending' },
        { id: 5, user: '@tech_guru', type: 'Account Lock', reason: 'Suspicious login activity', date: '2024-01-08', status: 'Approved' },
    ]);

    const handleAction = (id, action) => {
        setAppeals(appeals.map(a => a.id === id ? { ...a, status: action === 'approve' ? 'Approved' : 'Rejected' } : a));
        toast.success(`Appeal ${action === 'approve' ? 'approved' : 'rejected'}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Appeals Management</h1>
                <p className="text-muted-foreground mt-1">Review and manage user appeals regarding moderation actions.</p>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle>Recent Appeals</CardTitle>
                    <CardDescription className="text-muted-foreground">List of all pending and processed appeals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground">User</TableHead>
                                <TableHead className="text-muted-foreground">Type</TableHead>
                                <TableHead className="text-muted-foreground">Reason</TableHead>
                                <TableHead className="text-muted-foreground">Date</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appeals.map((appeal) => (
                                <TableRow key={appeal.id} className="border-border hover:bg-muted/50">
                                    <TableCell className="font-medium text-foreground">{appeal.user}</TableCell>
                                    <TableCell className="text-foreground">{appeal.type}</TableCell>
                                    <TableCell className="text-muted-foreground">{appeal.reason}</TableCell>
                                    <TableCell className="text-muted-foreground">{appeal.date}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`
                                                ${appeal.status === 'Approved' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                                                ${appeal.status === 'Rejected' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : ''}
                                                ${appeal.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : ''}
                                                border-none
                                            `}
                                        >
                                            {appeal.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {appeal.status === 'Pending' && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                                    onClick={() => handleAction(appeal.id, 'approve')}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleAction(appeal.id, 'reject')}
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
