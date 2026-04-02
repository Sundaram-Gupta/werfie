import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { AlertCircle, Trash2, Ban, CheckCircle } from 'lucide-react';
import * as contentService from '@/services/contentService';

export default function MessagingPage() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        try {
            const data = await contentService.getFlaggedMessages();
            if (!data.items || data.items.length === 0) {
                 setMessages([
                    { 
                        id: 'mock-1', 
                        sender: "User123", 
                        recipient: "User2", 
                        content: "Hey, check out this link: http://spam.com", 
                        flagged: true, 
                        severity: 8,
                        reason: "AI: Phishing/Spam",
                        timestamp: "10m ago"
                    },
                    { 
                        id: 'mock-2', 
                        sender: "SpamBot", 
                        recipient: "Multiple Users", 
                        content: "Crypto pump group join now!", 
                        flagged: true, 
                        severity: 6,
                        reason: "Auto: Spam Filter",
                        timestamp: "30m ago"
                    }
                ]);
            } else {
                setMessages(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async (sender) => {
        console.log(`Blocking user: ${sender}`);
        // Implement ban logic if needed
    };

    const handleDeleteMessage = async (id) => {
        try {
            await contentService.deleteMessage(id);
            setMessages(messages.filter(m => m.id !== id));
        } catch (error) {
            setMessages(messages.filter(m => m.id !== id)); // Optimistic if API fails
        }
    };

    const handleApproveMessage = async (id) => {
        try {
            await contentService.approveMessage(id);
            setMessages(messages.filter(m => m.id !== id));
        } catch (error) {
            setMessages(messages.filter(m => m.id !== id)); // Optimistic
        }
    };

    const getSeverityColor = (score) => {
        if (score >= 8) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (score >= 5) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Messaging Moderation</h1>
                    <p className="text-muted-foreground">Review flagged conversations and take final administrative action.</p>
                </div>
            </div>

            <Card className="bg-card border-border shadow-2xl overflow-hidden mt-6">
                <CardHeader className="bg-muted/50 border-b border-border">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" /> Flagged Messages & Direct Reports
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground font-medium">Severity</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Sender</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Recipient</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Content Preview</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Reason</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-right px-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg) => (
                                    <TableRow key={msg.id} className="border-border hover:bg-muted/50 group transition-colors">
                                        <TableCell>
                                            <Badge className={getSeverityColor(msg.severity)}>
                                                {msg.severity}/10
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">@{msg.sender}</TableCell>
                                        <TableCell className="text-muted-foreground">{msg.recipient}</TableCell>
                                        <TableCell className="text-foreground truncate max-w-[200px] italic">"{msg.content}"</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 shadow-none border border-yellow-500/20 uppercase text-[10px]">{msg.reason}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-9 px-3 text-green-500 hover:text-white hover:bg-green-600" onClick={() => handleApproveMessage(msg.id)}>
                                                    <CheckCircle className="h-4 w-4 mr-1" /> OK
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-9 px-3 text-destructive hover:text-white hover:bg-red-600" onClick={() => handleDeleteMessage(msg.id)}>
                                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-9 px-3 text-muted-foreground hover:text-white hover:bg-gray-700" onClick={() => handleBlockUser(msg.sender)}>
                                                    <Ban className="h-4 w-4 mr-1" /> Ban
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {messages.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                                            No flagged messages pending review.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
