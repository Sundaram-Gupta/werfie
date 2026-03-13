import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { configService } from '@/services/configService';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { 
    Key, 
    Bell, 
    Plus, 
    RefreshCw, 
    Trash2, 
    Shield, 
    Activity,
    Save,
    Send,
    Eye,
    EyeOff,
    CheckCircle2,
    XCircle,
    Copy,
    AlertTriangle,
    Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ConfigPage() {
    const [apiKeys, setApiKeys] = useState([]);
    const [stats, setStats] = useState({ totalRequests24h: '0', successRate: '0%', totalRevoked: 0, totalActive: 0 });
    const [pushConfigs, setPushConfigs] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("api-keys");

    // New Key State
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [newKeyData, setNewKeyData] = useState({ name: '', environment: 'dev', rateLimit: 100 });
    const [revealedKey, setRevealedKey] = useState(null);

    // Broadcast State
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '', targetType: 'all' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [keysData, push, logs] = await Promise.all([
                configService.getApiKeys(),
                configService.getPushConfigs(),
                configService.getBroadcasts()
            ]);
            setApiKeys(keysData.keys || []);
            setStats(keysData.stats || { totalRequests24h: '0', successRate: '0%', totalRevoked: 0, totalActive: 0 });
            setPushConfigs(push || []);
            setBroadcasts(logs || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load configuration");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useRefreshOnFocus(fetchData);

    const handleCreateKey = async () => {
        try {
            const result = await configService.createApiKey(newKeyData);
            setRevealedKey(result.rawKey);
            fetchData();
            toast.success("API Key generated successfully");
        } catch (error) {
            toast.error("Failed to generate key");
        }
    };

    const handleToggleKey = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        try {
            await configService.updateApiKey(id, { status: newStatus });
            setApiKeys(apiKeys.map(k => k.id === id ? { ...k, status: newStatus } : k));
            toast.success(`Key ${newStatus}`);
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const handleRevokeKey = async (id) => {
        if (!confirm("Are you sure you want to revoke this key? This action is permanent.")) return;
        try {
            await configService.revokeApiKey(id);
            setApiKeys(apiKeys.filter(k => k.id !== id));
            toast.success("Key revoked");
        } catch (error) {
            toast.error("Revoke failed");
        }
    };

    const handleRotateKey = async (id) => {
        if (!confirm("Rotate this key? Existing applications using the old key will break.")) return;
        try {
            const result = await configService.rotateApiKey(id);
            setRevealedKey(result.rawKey);
            toast.success("Key rotated. New key revealed.");
        } catch (error) {
            toast.error("Rotation failed");
        }
    };

    const handleSendBroadcast = async () => {
        try {
            await configService.sendBroadcast(broadcastData);
            setIsBroadcastModalOpen(false);
            setBroadcastData({ title: '', message: '', targetType: 'all' });
            fetchData();
            toast.success("Broadcast initiated successfully");
        } catch (error) {
            toast.error("Broadcast failed");
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
                    <p className="text-muted-foreground">Manage platform-wide API access and notification delivery.</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === "api-keys" ? (
                        <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" /> New API Key
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-background text-foreground border-border">
                                <DialogHeader>
                                    <DialogTitle>Generate Server API Key</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Use these keys to authenticate server-to-server or mobile requests.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Internal Name</Label>
                                        <Input 
                                            placeholder="e.g. Mobile App Prod" 
                                            className="bg-accent/50 border-input" 
                                            value={newKeyData.name}
                                            onChange={(e) => setNewKeyData({...newKeyData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Environment</Label>
                                            <select 
                                                className="w-full bg-accent/50 border border-input rounded-md p-2 text-sm"
                                                value={newKeyData.environment}
                                                onChange={(e) => setNewKeyData({...newKeyData, environment: e.target.value})}
                                            >
                                                <option value="dev">Development</option>
                                                <option value="staging">Staging</option>
                                                <option value="prod">Production</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Rate Limit (req/min)</Label>
                                            <Input 
                                                type="number" 
                                                className="bg-accent/50 border-input" 
                                                value={newKeyData.rateLimit}
                                                onChange={(e) => setNewKeyData({...newKeyData, rateLimit: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    
                                    {revealedKey && (
                                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2">
                                            <Label className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                <Shield className="w-3 h-3" /> Secret Key (Copy now, showing only once!)
                                            </Label>
                                            <div className="flex gap-2">
                                                <code className="flex-1 bg-zinc-100 dark:bg-black p-2 rounded text-xs select-all text-blue-700 dark:text-blue-300">
                                                    {revealedKey}
                                                </code>
                                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(revealedKey)}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { setIsKeyModalOpen(false); setRevealedKey(null); }}>
                                        {revealedKey ? "Done" : "Cancel"}
                                    </Button>
                                    {!revealedKey && <Button onClick={handleCreateKey}>Generate Key</Button>}
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-orange-600 hover:bg-orange-700">
                                    <Send className="w-4 h-4 mr-2" /> Global Broadcast
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg bg-background text-foreground border-border">
                                <DialogHeader>
                                    <DialogTitle>Send Push Notification Broadcast</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        This will send a real-time notification to all registered devices.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Notification Title</Label>
                                        <Input 
                                            placeholder="Alert Title" 
                                            className="bg-accent/50 border-input"
                                            value={broadcastData.title}
                                            onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Message Content</Label>
                                        <textarea 
                                            className="w-full bg-accent/50 border border-input rounded-md p-3 min-h-[100px] text-sm text-foreground"
                                            placeholder="What would you like to say?"
                                            value={broadcastData.message}
                                            onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500 mr-auto">
                                        <AlertTriangle className="w-4 h-4" />
                                        Sent to ~12.5k users immediately.
                                    </div>
                                    <Button variant="outline" onClick={() => setIsBroadcastModalOpen(false)}>Cancel</Button>
                                    <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSendBroadcast}>Send Now</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <Tabs defaultValue="api-keys" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted border border-border p-1 rounded-full">
                    <TabsTrigger value="api-keys" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">
                        <Key className="w-4 h-4 mr-2" /> API Server Keys
                    </TabsTrigger>
                    <TabsTrigger value="push" className="rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm">
                        <Bell className="w-4 h-4 mr-2" /> Push Notifications
                    </TabsTrigger>
                </TabsList>

                {/* API KEYS TAB */}
                <TabsContent value="api-keys" className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-card border-border text-card-foreground">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-muted-foreground flex items-center gap-2 font-medium">
                                    <Activity className="w-4 h-4 text-blue-500" /> 24h Requests
                                </CardDescription>
                                <CardTitle className="text-2xl font-bold">{stats.totalRequests24h}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="bg-card border-border text-card-foreground">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-muted-foreground flex items-center gap-2 font-medium">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Success Rate
                                </CardDescription>
                                <CardTitle className="text-2xl font-bold">{stats.successRate}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="bg-card border-border text-card-foreground">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-muted-foreground flex items-center gap-2 font-medium">
                                    <XCircle className="w-4 h-4 text-red-500" /> Blocked/Revoked
                                </CardDescription>
                                <CardTitle className="text-2xl font-bold">{stats.totalRevoked}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="w-[250px]">Key Name & ID</TableHead>
                                    <TableHead>Environment</TableHead>
                                    <TableHead>Rate Limit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-10">Loading keys...</TableCell></TableRow>
                                ) : apiKeys.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500">No active API keys found.</TableCell></TableRow>
                                ) : (
                                    apiKeys.map((key) => (
                                        <TableRow key={key.id} className="border-border hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-semibold">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{key.name}</span>
                                                    <code className="text-[10px] text-muted-foreground font-mono">{key.keyPrefix}************</code>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "capitalize px-2 py-0.5 font-bold text-[10px]",
                                                    key.environment === 'prod' ? "border-red-500 text-red-500 bg-red-500/5" : 
                                                    key.environment === 'staging' ? "border-yellow-500 text-yellow-600 bg-yellow-500/5" : "border-muted-foreground text-muted-foreground"
                                                )}>
                                                    {key.environment}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-medium">
                                                {key.rateLimit} req / min
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        key.status === 'active' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground/30"
                                                    )} />
                                                    <span className="capitalize text-muted-foreground text-xs font-bold">{key.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs font-medium">
                                                {new Date(key.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" title="Rotate Key" onClick={() => handleRotateKey(key.id)}>
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" title={key.status === 'active' ? "Disable" : "Enable"} onClick={() => handleToggleKey(key.id, key.status)}>
                                                        <Shield className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" title="Revoke" onClick={() => handleRevokeKey(key.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* PUSH NOTIFICATIONS TAB */}
                <TabsContent value="push" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Dynamic Push Provider Configs */}
                        <div className="space-y-6">
                            {pushConfigs.length === 0 ? (
                                <Card className="bg-card border-border text-card-foreground shadow-sm">
                                    <CardContent className="py-10 text-center text-muted-foreground italic">
                                        No push notification providers configured.
                                    </CardContent>
                                </Card>
                            ) : (
                                pushConfigs.map(config => (
                                    <Card key={config.id} className="bg-card border-border text-card-foreground shadow-sm">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Bell className="w-6 h-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>{config.provider === 'FCM' ? 'Firebase Cloud Messaging' : config.provider === 'APNS' ? 'Apple Push (APNs)' : config.provider}</CardTitle>
                                                        <CardDescription className="text-muted-foreground font-mono text-xs mt-1 font-bold">ID: {config.id}</CardDescription>
                                                    </div>
                                                </div>
                                                <Switch checked={config.enabled} onClick={() => toast.info("Toggle functionality pending implementation")} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Credentials (JSON)</Label>
                                                <div className="relative">
                                                    <textarea 
                                                        readOnly 
                                                        value={config.credentials || '{}'}
                                                        className="w-full bg-accent/30 border border-border rounded-md p-3 font-mono text-[10px] text-muted-foreground h-32"
                                                    />
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => toast.info("Enter edit mode to change credentials")}
                                                    >
                                                        <Terminal className="w-4 h-4 mr-2" /> Edit
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {config.allowedTypes?.map(type => (
                                                    <Badge key={type} variant="secondary" className="bg-accent text-accent-foreground font-bold text-[10px] capitalize">{type}</Badge>
                                                ))}
                                            </div>
                                            <Button className="w-full bg-primary text-primary-foreground hover:opacity-90">Save Configuration</Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {/* Recent Broadcasts */}
                        <Card className="bg-card border-border text-card-foreground shadow-sm">
                            <CardHeader>
                                <CardTitle>Recent Admin Broadcasts</CardTitle>
                                <CardDescription className="text-muted-foreground">History of platform-wide alerts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {broadcasts.length === 0 ? (
                                        <p className="text-center py-10 text-muted-foreground italic">No broadcasts sent yet.</p>
                                    ) : (
                                        broadcasts.map(b => {
                                            const metrics = b.metrics ? JSON.parse(b.metrics) : { delivered: 0, failures: 0 };
                                            return (
                                                <div key={b.id} className="p-3 border border-border rounded-lg bg-accent/20 flex flex-col gap-1">
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-sm text-foreground">{b.title}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{new Date(b.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{b.message}</p>
                                                    <div className="flex gap-3 mt-2">
                                                        <span className="text-[10px] text-green-600 font-bold">Delivered: {metrics.delivered?.toLocaleString() || 0}</span>
                                                        <span className="text-[10px] text-red-600 font-bold">Failed: {metrics.failures || 0}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
