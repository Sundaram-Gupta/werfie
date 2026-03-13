import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Moon, Sun } from 'lucide-react';

export default function SettingsPage() {
    const [darkMode, setDarkMode] = useState(
        document.documentElement.classList.contains('dark')
    );
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const toggleTheme = (checked) => {
        setDarkMode(checked);
        if (checked) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Manage your public profile and account details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the admin panel look.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                <Label htmlFor="dark-mode">Dark Mode</Label>
                            </div>
                            <Switch
                                id="dark-mode"
                                checked={darkMode}
                                onCheckedChange={toggleTheme}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>System Preferences</CardTitle>
                        <CardDescription>Manage global system settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="maintenance">Maintenance Mode</Label>
                            <Switch
                                id="maintenance"
                                checked={maintenanceMode}
                                onCheckedChange={setMaintenanceMode}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-notifs">Email Notifications</Label>
                            <Switch
                                id="email-notifs"
                                checked={emailNotifs}
                                onCheckedChange={setEmailNotifs}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Admin Roles</CardTitle>
                        <CardDescription>Manage other admin accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Invite New Admin</Label>
                            <div className="flex gap-2">
                                <Input placeholder="admin@example.com" />
                                <Button>Invite</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

function ProfileForm() {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        password: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const updates = {
                name: formData.name,
                email: formData.email,
                avatar: formData.avatar,
            };
            if (formData.password) {
                // In a real app, handle password change separately or securely
                updates.password = formData.password;
            }
            await updateUser(updates);
            // alert("Profile updated successfully");
        } catch (error) {
            console.error(error);
            // alert("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <div className="flex gap-4 items-center">
                    <img
                        src={formData.avatar || '/placeholder.png'}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover bg-secondary"
                    />
                    <Input
                        id="avatar"
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        placeholder="https://example.com/avatar.png"
                    />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
            </div>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
        </form>
    );
}
