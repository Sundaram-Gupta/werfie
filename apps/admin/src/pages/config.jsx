import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function ConfigPage() {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        siteName: 'Werfie',
        supportEmail: 'support@werfie.com',
        allowRegistrations: true,
        requireEmailVerification: true,
        maintenanceMode: false,
        maxPostLength: 280,
        maxUploadSize: 10,
        rateLimitPerMinute: 60,
    });

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
        toast.success("Global configuration updated");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Global Configuration</h1>
                    <p className="text-gray-400 mt-1">Manage system-wide settings and policies.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20">
                        {loading ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Platform Identity */}
                <Card className="bg-[#151516] border-white/5 shadow-sm">
                    <CardHeader>
                        <CardTitle>Platform Settings</CardTitle>
                        <CardDescription className="text-gray-500">General platform identity and contact info.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input
                                id="siteName"
                                value={config.siteName}
                                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                                className="bg-[#0a0a0b] border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supportEmail">Support Email</Label>
                            <Input
                                id="supportEmail"
                                value={config.supportEmail}
                                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                                className="bg-[#0a0a0b] border-white/10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Access Control */}
                <Card className="bg-[#151516] border-white/5 shadow-sm">
                    <CardHeader>
                        <CardTitle>Access Control</CardTitle>
                        <CardDescription className="text-gray-500">Manage user registration and authentication.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow Registrations</Label>
                                <p className="text-xs text-gray-500">New users can sign up.</p>
                            </div>
                            <Switch
                                checked={config.allowRegistrations}
                                onCheckedChange={(c) => setConfig({ ...config, allowRegistrations: c })}
                            />
                        </div>
                        <Separator className="bg-white/5" />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Email Verification</Label>
                                <p className="text-xs text-gray-500">Require email verification before login.</p>
                            </div>
                            <Switch
                                checked={config.requireEmailVerification}
                                onCheckedChange={(c) => setConfig({ ...config, requireEmailVerification: c })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Content Policy */}
                <Card className="bg-[#151516] border-white/5 shadow-sm">
                    <CardHeader>
                        <CardTitle>Content Policy</CardTitle>
                        <CardDescription className="text-gray-500">Limits on user-generated content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="postLen">Max Post Length (chars)</Label>
                                <Input
                                    id="postLen"
                                    type="number"
                                    value={config.maxPostLength}
                                    onChange={(e) => setConfig({ ...config, maxPostLength: parseInt(e.target.value) })}
                                    className="bg-[#0a0a0b] border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="uploadSize">Max Upload Size (MB)</Label>
                                <Input
                                    id="uploadSize"
                                    type="number"
                                    value={config.maxUploadSize}
                                    onChange={(e) => setConfig({ ...config, maxUploadSize: parseInt(e.target.value) })}
                                    className="bg-[#0a0a0b] border-white/10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Safety & Performance */}
                <Card className="bg-[#151516] border-white/5 shadow-sm">
                    <CardHeader>
                        <CardTitle>Safety & Performance</CardTitle>
                        <CardDescription className="text-gray-500">System limits and safety modes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="rateLimit">Global Rate Limit (req/min)</Label>
                            <Input
                                id="rateLimit"
                                type="number"
                                value={config.rateLimitPerMinute}
                                onChange={(e) => setConfig({ ...config, rateLimitPerMinute: parseInt(e.target.value) })}
                                className="bg-[#0a0a0b] border-white/10"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2 text-red-400"><AlertCircle className="h-4 w-4" /> Emergency Maintenance</Label>
                                <p className="text-xs text-gray-500">Take site offline immediately.</p>
                            </div>
                            <Switch
                                checked={config.maintenanceMode}
                                onCheckedChange={(c) => setConfig({ ...config, maintenanceMode: c })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
