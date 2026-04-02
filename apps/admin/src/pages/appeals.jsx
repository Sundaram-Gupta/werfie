import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function AppealsPage() {
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());

    useEffect(() => {
        const fetchAppeals = async () => {
            try {
                // Use the authorized api instance
                const response = await api.get('/admin/appeals');
                // The shared api instance already extracts the data from { status, data }
                // but let's check the normalization logic in axios.js
                // Axios interceptor handles normalization if it matches {status, data}
                const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
                setAppeals(data);
            } catch (error) {
                console.error("Failed to fetch appeals", error);
                toast.error("Failed to load appeals");
            } finally {
                setLoading(false);
            }
        };
        fetchAppeals();
    }, []);

    const handleAction = async (id, action) => {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        
        setProcessingIds(prev => new Set(prev).add(id));
        
        try {
            await api.patch(`/admin/appeals/${id}`, { status: newStatus });
            setAppeals(appeals.map(a => a.id === id ? { ...a, status: newStatus } : a));
            toast.success(`Appeal ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        } catch (error) {
            console.error("Failed to update appeal", error);
            toast.error("Failed to process appeal. Please try again.");
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Appeals Management</h1>
                <p className="text-muted-foreground mt-1">Review and manage user appeals regarding moderation actions.</p>
            </div>

            <Card className="bg-card border-white/10 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-muted/20">
                    <CardTitle>Recent Appeals</CardTitle>
                    <CardDescription className="text-muted-foreground">List of all pending and processed appeals.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent bg-muted/30">
                                <TableHead className="text-muted-foreground font-semibold">User</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Type</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Reason</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Date</TableHead>
                                <TableHead className="text-muted-foreground font-semibold text-center">Status</TableHead>
                                <TableHead className="text-right text-muted-foreground font-semibold pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : appeals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No appeals found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                appeals.map((appeal) => (
                                    <TableRow key={appeal.id} className="border-white/5 hover:bg-muted/40 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 rounded-full border border-white/10">
                                                    <AvatarImage src={appeal.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${appeal.user}`} />
                                                    <AvatarFallback>{appeal.user?.charAt(1)?.toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-foreground">{appeal.user}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-foreground font-medium">{appeal.type}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-[300px] truncate" title={appeal.reason}>
                                            {appeal.reason}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{appeal.date}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={`
                                                    rounded-full px-3 py-0.5 whitespace-nowrap
                                                    ${appeal.status === 'Approved' ? 'border-green-500/30 text-green-400 bg-green-500/10' : ''}
                                                    ${appeal.status === 'Rejected' ? 'border-red-500/30 text-red-400 bg-red-500/10' : ''}
                                                    ${appeal.status === 'Pending' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10' : ''}
                                                `}
                                            >
                                                {appeal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {appeal.status === 'Pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={processingIds.has(appeal.id)}
                                                        className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/20 rounded-full transition-colors"
                                                        onClick={() => handleAction(appeal.id, 'approve')}
                                                    >
                                                        {processingIds.has(appeal.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-4 w-4" />
                                                        )}
                                                        <span className="sr-only">Approve</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={processingIds.has(appeal.id)}
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                                                        onClick={() => handleAction(appeal.id, 'reject')}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        <span className="sr-only">Reject</span>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic opacity-50">Processed</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
