import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ShieldCheck, LayoutDashboard, Globe } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('admin');
    const [role, setRole] = useState('admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password, role);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
            {/* Visual Side (Left) */}
            <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden bg-zinc-900 text-white">
                {/* Background decorative elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/20 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/20 blur-[130px] rounded-full translate-y-1/2 -translate-x-1/3" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2">
                    <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
                        <div className="h-4 w-4 bg-black rounded-sm" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Werfie Admin</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
                        Manage your community with confidence and style.
                    </h2>
                    <p className="text-zinc-400 text-lg">
                        Complete control over users, content, and system configurations efficiently.
                    </p>
                    
                    <div className="mt-12 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <ShieldCheck className="h-6 w-6 text-blue-400" />
                            <h3 className="font-semibold mt-1">Secure Access</h3>
                            <p className="text-xs text-zinc-500">Enterprise-grade security protocols.</p>
                        </div>
                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <LayoutDashboard className="h-6 w-6 text-purple-400" />
                            <h3 className="font-semibold mt-1">Real-time Analytics</h3>
                            <p className="text-xs text-zinc-500">Monitor platform growth instantly.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-zinc-500 flex items-center gap-6">
                    <span>© 2026 Werfie Inc.</span>
                    <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> werfie.com</span>
                </div>
            </div>

            {/* Form Side (Right) */}
            <div className="flex items-center justify-center p-8 bg-background relative">
                 {/* Mobile background bubbles (visible only on small screens) */}
                 <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full lg:hidden pointer-events-none" />

                <div className="mx-auto w-full max-w-[380px] space-y-8 relative z-10">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 lg:hidden">
                            <div className="h-6 w-6 bg-primary rounded-sm" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md text-center animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-muted/50 border-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary" tabIndex={-1} type="button">
                                        Forgot password?
                                    </Button>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-muted/50 border-input"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="bg-muted/50 border-input">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Super Admin</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                        <SelectItem value="analyst">Analyst</SelectItem>
                                        <SelectItem value="support">Support</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button className="w-full h-10 font-semibold shadow-lg shadow-primary/25" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                        
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            Don't have an account? <span className="font-semibold text-foreground">Contact IT Support</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
