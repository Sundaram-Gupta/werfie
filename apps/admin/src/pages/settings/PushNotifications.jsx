import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronRight, Home, Smartphone, Save, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export default function PushNotificationsSettingsPage() {
    const [enabled, setEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsLoading(false);
        toast.success("Push notification settings saved successfully");
    };

    const handleSendTest = () => {
        toast.info("Test notification sent to your registered device");
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Push Notifications Settings</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Link to="/" className="flex items-center hover:text-foreground transition-colors">
                        <Home className="h-4 w-4 mr-1" />
                        Home
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-muted-foreground">API Settings</span>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-foreground">Push Notifications</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid gap-6">
                {/* General Status Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-foreground flex items-center justify-between">
                            <span>Enable Push Notifications</span>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </CardTitle>
                        <CardDescription>
                            Toggle push notifications for all users. Turning this off will stop all outgoing notifications.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Configuration Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-blue-400" />
                            Firebase Cloud Messaging (FCM)
                        </CardTitle>
                        <CardDescription>
                            Configure your FCM keys here to enable mobile and web push notifications.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">FCM Server Key</Label>
                                <Input 
                                    type="password"
                                    placeholder="Enter your legacy server key or service account key..."
                                    className="bg-muted border-transparent text-foreground placeholder:text-muted-foreground font-mono text-sm"
                                    defaultValue="AAAA..."
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Found in Firebase Console {'>'} Project Settings {'>'} Cloud Messaging
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-foreground">Sender ID</Label>
                                <Input 
                                    placeholder="e.g., 40319203..."
                                    className="bg-muted border-transparent text-foreground placeholder:text-muted-foreground font-mono text-sm"
                                    defaultValue="839210..."
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                             <Button 
                                variant="outline" 
                                onClick={handleSendTest}
                                className="text-muted-foreground hover:text-foreground"
                                disabled={!enabled}
                            >
                                <Send className="mr-2 h-4 w-4" /> Send Test Notification
                            </Button>

                            <Button 
                                onClick={handleSave} 
                                disabled={isLoading || !enabled}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                            >
                                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
