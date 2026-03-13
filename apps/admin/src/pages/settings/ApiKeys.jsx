import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ApiKeysPage() {
    return (
        <div className="space-y-6">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage API Server Keys</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Link to="/" className="flex items-center hover:text-foreground transition-colors">
                        <Home className="h-4 w-4 mr-1" />
                        Home
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-muted-foreground">API Settings</span>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="text-foreground">Manage API Server Keys</span>
                </div>
            </div>

            {/* Main Content */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-medium text-foreground">API Settings (API v1)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-md text-sm">
                        Use these keys to setup your application.
                    </div>

                    {/* API Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">API ID</label>
                            <Input 
                                value="werfie_app_v1_837492" 
                                readOnly 
                                className="bg-muted border-transparent text-muted-foreground"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">API Secret Key</label>
                            <Input 
                                value="sk_live_xxxxxxxxxxxxxxxxxxxx" 
                                readOnly 
                                className="bg-muted border-transparent text-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white font-medium px-6">
                        RESET KEYS
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
