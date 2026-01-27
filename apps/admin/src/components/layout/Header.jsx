import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Bell, LayoutGrid, Globe } from 'lucide-react';

import { Link } from 'react-router-dom';

export function Header() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <header className="h-[72px] px-8 flex items-center justify-between sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/5">
            {/* Left/Center: Search */}
            <div className="flex-1 max-w-2xl hidden md:flex items-center">
                <div className="relative w-full max-w-md group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-white transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search or type a command..."
                        className="w-full h-11 bg-[#151516] border border-white/5 rounded-xl pl-11 pr-12 text-sm text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:bg-[#1a1a1c] transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 ml-auto">
                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full border border-white/5 hidden md:flex" asChild>
                    <Link to="/">
                        <LayoutGrid className="h-5 w-5" />
                    </Link>
                </Button>

                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full border border-white/5 hidden md:flex" asChild>
                    <Link to="/config">
                        <Globe className="h-5 w-5" />
                    </Link>
                </Button>

                <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full border border-white/5 relative" asChild>
                    <Link to="/notifications">
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-[3px] border-[#0a0a0b] font-bold">6</span>
                        <Bell className="h-5 w-5" />
                    </Link>
                </Button>

                <div className="h-8 w-px bg-white/10 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent">
                            <Avatar className="h-9 w-9 border border-white/10 ring-2 ring-white/5 transition-all hover:ring-white/10">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="bg-blue-600/20 text-blue-400 font-medium border border-blue-500/20">JD</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-[#0a0a0b] rounded-full"></span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 glass-panel border-white/10 bg-[#151516] text-gray-200" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-white">{user.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer" asChild>
                            <Link to="/settings" className="w-full flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
