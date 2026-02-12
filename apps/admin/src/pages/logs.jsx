import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    
    // Simulate real-time logs
    useEffect(() => {
        const initialLogs = [
            { id: 1, service: "auth-service", level: "info", message: "User login successful: user_123", timestamp: new Date() },
            { id: 2, service: "user-service", level: "warn", message: "Rate limit exceeded for IP 192.168.1.1", timestamp: new Date(Date.now() - 5000) },
            { id: 3, service: "content-service", level: "error", message: "Database connection timeout", timestamp: new Date(Date.now() - 10000) },
        ];
        setLogs(initialLogs);

        const interval = setInterval(() => {
            const newLog = {
                id: Date.now(),
                service: ["auth-service", "user-service", "content-service", "notification-service"][Math.floor(Math.random() * 4)],
                level: ["info", "warn", "error"][Math.floor(Math.random() * 3)],
                message: `System event: ${Math.random().toString(36).substring(7)}`,
                timestamp: new Date()
            };
            setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 max-h-screen flex flex-col">
            <div className="flex items-center justify-between pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">System Logs</h1>
                    <p className="text-muted-foreground">Real-time stream of microservice logs.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-xs">Export CSV</Button>
                    <Button variant="destructive" className="text-xs">Clear Filter</Button>
                </div>
            </div>

            <Card className="flex-1 bg-card border-border font-mono text-sm overflow-hidden flex flex-col h-[600px]">
                <CardHeader className="py-3 border-b border-border bg-muted/50">
                    <div className="grid grid-cols-12 gap-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        <div className="col-span-2">Timestamp</div>
                        <div className="col-span-2">Service</div>
                        <div className="col-span-1">Level</div>
                        <div className="col-span-7">Message</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="divide-y divide-border">
                            {logs.map((log) => (
                                <div key={log.id} className="grid grid-cols-12 gap-4 px-4 py-2 hover:bg-muted/50 transition-colors">
                                    <div className="col-span-2 text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                        {format(log.timestamp, 'HH:mm:ss.SSS')}
                                    </div>
                                    <div className="col-span-2 text-blue-500 whitespace-nowrap overflow-hidden text-ellipsis">
                                        {log.service}
                                    </div>
                                    <div className={`col-span-1 font-bold ${
                                        log.level === 'error' ? 'text-red-500' :
                                        log.level === 'warn' ? 'text-yellow-500' : 'text-green-500'
                                    }`}>
                                        {log.level.toUpperCase()}
                                    </div>
                                    <div className="col-span-7 text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                        {log.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
