import { useState, useEffect } from 'react';
import * as userService from '@/services/userService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Shield, Ban, CheckCircle, Search, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const data = await userService.getUsers(1, 10, search);
                setUsers(data.users);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        // Debounce would be better here in real app
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const handleAction = async (userId, action) => {
        // Optimistic update
        setUsers(users.map(u => {
            if (u.id === userId) {
                let newStatus = u.status;
                if (action === 'ban') newStatus = 'banned';
                if (action === 'suspend') newStatus = 'suspended';
                if (action === 'verify') newStatus = 'verified';
                if (action === 'activate') newStatus = 'active';
                return { ...u, status: newStatus };
            }
            return u;
        }));
        await userService.updateUserStatus(userId, action);
    };

    const openProfile = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified': return <Badge className="bg-blue-500 hover:bg-blue-600">Verified</Badge>;
            case 'banned': return <Badge variant="destructive">Banned</Badge>;
            case 'suspended': return <Badge variant="warning" className="bg-yellow-500 hover:bg-yellow-600 text-white">Suspended</Badge>;
            default: return <Badge variant="secondary">Active</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-xl glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Posts</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.handle}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                                    <TableCell>{user.joined}</TableCell>
                                    <TableCell className="text-right">{user.posts}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openProfile(user)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'verify')}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" /> Verify User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'suspend')}>
                                                    <Shield className="mr-2 h-4 w-4 text-yellow-500" /> Suspend
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'ban')} className="text-red-500 focus:text-red-500">
                                                    <Ban className="mr-2 h-4 w-4" /> Ban User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                        <DialogDescription>
                            Detailed view of the user's account.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col items-center gap-2 mb-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarFallback className="text-2xl">{selectedUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedUser.handle}</p>
                                {getStatusBadge(selectedUser.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold">Email:</span>
                                    <p className="text-muted-foreground">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Joined:</span>
                                    <p className="text-muted-foreground">{selectedUser.joined}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Total Posts:</span>
                                    <p className="text-muted-foreground">{selectedUser.posts}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">User ID:</span>
                                    <p className="text-muted-foreground">{selectedUser.id}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
