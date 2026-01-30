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
import { AlertCircle, Trash2, Ban } from 'lucide-react';

export default function MessagingPage() {
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            sender: "User123", 
            recipient: "User2", 
            content: "Hey, check out this link: http://spam.com", 
            flagged: true, 
            reason: "Phishing/Spam",
            timestamp: "10m ago"
        },
        { 
            id: 2, 
            sender: "SpamBot", 
            recipient: "Multiple Users", 
            content: "Crypto pump group join now!", 
            flagged: true, 
            reason: "Spam",
            timestamp: "30m ago"
        }
    ]);

    const handleBlockUser = (sender) => {
        // Implement block logic
        console.log(`Blocking user: ${sender}`);
    };

    const handleDeleteMessage = (id) => {
        setMessages(messages.filter(m => m.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Messaging Moderation</h1>
                    <p className="text-muted-foreground">Review flagged conversations and manage direct message restrictions.</p>
                </div>
            </div>

            <Card className="bg-card border-border shadow-2xl overflow-hidden mt-6">
                <CardHeader className="bg-muted/50 border-b border-border">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-500" /> Flagged Messages
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground font-medium">Flagged</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Sender</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Recipient</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Content Preview</TableHead>
                                    <TableHead className="text-muted-foreground font-medium">Reason</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg) => (
                                    <TableRow key={msg.id} className="border-border hover:bg-muted/50 group transition-colors">
                                        <TableCell>
                                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border border-red-500/20">Flagged</Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">{msg.sender}</TableCell>
                                        <TableCell className="text-muted-foreground">{msg.recipient}</TableCell>
                                        <TableCell className="text-foreground truncate max-w-[200px]">{msg.content}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 shadow-none border border-yellow-500/20">{msg.reason}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteMessage(msg.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleBlockUser(msg.sender)}>
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
