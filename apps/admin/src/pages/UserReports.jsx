import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming we have this or I'll standard input
import { ChevronRight, Home, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock Data
const MOCK_REPORTS = [
    {
        id: 8628,
        type: "Goes against my beliefs, values or politics",
        reporter: {
            name: "Vvv Huru",
            avatar: null
        },
        link: "Deen Doughouz",
        time: "16 w",
    },
    {
        id: 8627,
        type: "Illegal activity",
        reporter: {
            name: "Alex Hiward",
            avatar: "https://github.com/shadcn.png" 
        },
        link: "Buy Telegram Account",
        time: "18 w",
    },
    {
        id: 8624,
        type: "Illegal or regulated goods or services",
        reporter: {
            name: "Al Imran Niloy",
            avatar: "https://github.com/shadcn.png"
        },
        link: "Al Imran Niloy",
        time: "20 w",
    }
];

export default function UserReportsPage() {
    const [reports, setReports] = useState(MOCK_REPORTS);

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage Users Reports</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Link to="/" className="flex items-center hover:text-foreground transition-colors">
                        <Home className="h-4 w-4 mr-1" />
                        Home
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link to="/reports" className="hover:text-foreground transition-colors">
                        Reports
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-foreground">Manage Users Reports</span>
                </div>
            </div>

            {/* Main Content */}
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium text-foreground">Manage Users Reports</CardTitle>
                    <Button variant="outline" className="h-8 px-4 text-xs font-semibold">
                        All
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                                <TableHead className="w-[50px]">
                                    <input type="checkbox" className="rounded border-muted-foreground bg-transparent" />
                                </TableHead>
                                <TableHead className="w-[100px] text-muted-foreground font-bold text-xs uppercase cursor-pointer">
                                    <div className="flex items-center gap-1">
                                        ID <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Type</TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Reporter</TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Link</TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase cursor-pointer">
                                    <div className="flex items-center gap-1">
                                        Time <ArrowUpDown className="h-3 w-3" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-muted-foreground font-bold text-xs uppercase">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow key={report.id} className="border-border hover:bg-muted/50">
                                    <TableCell>
                                        <input type="checkbox" className="rounded border-muted-foreground bg-transparent" />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{report.id}</TableCell>
                                    <TableCell className="text-foreground w-[200px] leading-snug">{report.type}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 rounded-md bg-muted">
                                                {report.reporter.avatar ? (
                                                     <AvatarImage src={report.reporter.avatar} />
                                                ) : (
                                                    <div className="h-full w-full bg-linear-to-br from-gray-600 to-gray-800" />
                                                )}
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-foreground text-sm font-medium">{report.reporter.name}</span>
                                                {/* Hidden handle/email if needed */}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-foreground">{report.link}</TableCell>
                                    <TableCell className="text-muted-foreground">{report.time}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 w-[120px]">
                                            <Button size="sm" className="h-6 w-full bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] font-semibold rounded-sm justify-center p-0 shadow-none border border-green-500/20">
                                                Delete Report
                                            </Button>
                                            <Button size="sm" className="h-6 w-full bg-destructive/10 text-destructive hover:bg-destructive/20 text-[10px] font-semibold rounded-sm justify-center p-0 shadow-none border border-destructive/20">
                                                Delete User
                                            </Button>
                                            <Button size="sm" className="h-6 w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-[10px] font-semibold rounded-sm justify-center p-0 shadow-none border border-blue-500/20">
                                                View Report
                                            </Button>
                                            <Button size="sm" className="h-6 w-full bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 text-[10px] font-semibold rounded-sm justify-center p-0 shadow-none border border-pink-500/20">
                                                Ban User
                                            </Button>
                                        </div>
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
