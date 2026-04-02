import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Home, ArrowUpDown, RefreshCw, ShieldOff, Ban, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { BanUserModal } from '@/components/modals/BanUserModal';

export default function UserReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [banTarget, setBanTarget] = useState(null); // { reportId, userId, reporterHandle }

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/reports');
            const data = res.data?.data ?? res.data ?? [];
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Delete this report permanently?')) return;
        try {
            await api.patch(`/admin/reports/${reportId}`, { status: 'resolved' });
            toast.success('Report resolved and archived');
            fetchReports();
        } catch {
            toast.error('Failed to delete report');
        }
    };

    const handleBanSuccess = () => {
        setBanTarget(null);
        fetchReports();
        toast.success('User ban applied successfully');
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage Users Reports</h1>
                    <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Link to="/" className="flex items-center hover:text-foreground transition-colors">
                        <Home className="h-4 w-4 mr-1" />Home
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link to="/reports" className="hover:text-foreground transition-colors">Reports</Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-foreground">Manage Users Reports</span>
                </div>
            </div>

            {/* Main Table */}
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-foreground">
                        All Reports
                        {!loading && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {reports.length} total
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                                <TableHead className="w-[100px] text-muted-foreground font-bold text-xs uppercase cursor-pointer">
                                    <div className="flex items-center gap-1">ID <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Reason</TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Reporter</TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Target</TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase cursor-pointer">
                                    <div className="flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></div>
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                                        Loading reports...
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No reports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.id} className="border-border hover:bg-muted/50">
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            #{report.id?.slice(0, 8)}
                                        </TableCell>
                                        <TableCell className="text-foreground max-w-[200px] leading-snug text-sm">
                                            {report.reason || report.type || 'No reason provided'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-7 w-7 rounded-md bg-muted">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${report.reporter}`} />
                                                </Avatar>
                                                <span className="text-foreground text-sm font-medium">{report.reporter}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <span className="capitalize">{report.targetType}</span>
                                            {report.targetId && <span className="ml-1 text-xs opacity-60">#{report.targetId?.slice(0, 8)}</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    report.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                                                    report.status === 'resolved' ? 'border-green-500 text-green-500' :
                                                    report.status === 'escalated' ? 'border-red-500 text-red-500' :
                                                    'border-muted-foreground text-muted-foreground'
                                                }
                                            >
                                                {report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 w-[130px]">
                                                <Button
                                                    size="sm"
                                                    className="h-6 w-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-[10px] font-semibold rounded-sm border border-yellow-500/20"
                                                    onClick={() => setBanTarget({
                                                        reportId: report.id,
                                                        userId: report.reportedUserId,
                                                        handle: report.reporter
                                                    })}
                                                >
                                                    <ShieldOff className="h-3 w-3 mr-1" /> Temp Ban
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-6 w-full bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-semibold rounded-sm border border-destructive/20"
                                                    onClick={() => setBanTarget({
                                                        reportId: report.id,
                                                        userId: report.reportedUserId,
                                                        handle: report.reporter,
                                                        forcePermanent: true
                                                    })}
                                                >
                                                    <Ban className="h-3 w-3 mr-1" /> Perm Ban
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-6 w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-[10px] font-semibold rounded-sm border border-blue-500/20"
                                                    onClick={() => handleDeleteReport(report.id)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" /> Resolve
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Ban Modal */}
            {banTarget && (
                <BanUserModal
                    isOpen={!!banTarget}
                    onClose={() => setBanTarget(null)}
                    userId={banTarget.userId}
                    userHandle={banTarget.handle}
                    forcePermanent={banTarget.forcePermanent}
                    onSuccess={handleBanSuccess}
                />
            )}
        </div>
    );
}
