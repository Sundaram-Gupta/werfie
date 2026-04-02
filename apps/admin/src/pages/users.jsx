import { useState, useEffect, useCallback } from 'react';
import * as userService from '@/services/userService';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
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
    DropdownMenuSeparator,
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
import { MoreHorizontal, Shield, Ban, CheckCircle, Search, Eye, Trash2, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const limit = 10;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await userService.getUsers(page, limit, search);
            const usersList = data?.users || [];
            if (Array.isArray(data)) {
                 setUsers(data);
                 setTotalPages(1);
            } else {
                 setUsers(usersList);
                 setTotalPages(data?.pagination?.totalPages || 1);
                 setTotalUsers(data?.pagination?.totalUsers || 0);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    useRefreshOnFocus(fetchUsers);

    const handleAction = async (userId, action, value) => {
        try {
            if (action === 'status') {
               await userService.updateUserStatus(userId, value);
            } else if (action === 'role') {
               await userService.updateUserRole(userId, value);
            } else if (action === 'delete') {
               if (!confirm('Are you sure you want to delete this user?')) return;
               await userService.deleteUser(userId);
            } else if (action === 'verify') {
                await userService.updateUserVerification(userId, value);
            }
            
            // Refresh list
            fetchUsers();
        } catch (error) {
            console.error('Action failed:', error);
            alert('Failed to update user');
        }
    };

    const openProfile = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE': return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
            case 'SUSPENDED': return <Badge variant="warning" className="bg-yellow-500 hover:bg-yellow-600 text-white">Suspended</Badge>;
            case 'DELETED': return <Badge variant="destructive">Deleted</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'SUPER_ADMIN': return <Badge className="bg-purple-600">Super Admin</Badge>;
            case 'ADMIN': return <Badge className="bg-blue-600">Admin</Badge>;
            case 'MODERATOR': return <Badge className="bg-indigo-500">Moderator</Badge>;
            default: return <Badge variant="outline">User</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="rounded-xl glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.profile?.avatar} />
                                                <AvatarFallback>{user.profile?.name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span>{user.profile?.name || 'Unknown'}</span>
                                                <span className="text-xs text-muted-foreground">{user.profile?.handle || user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                                    <TableCell>
                                        {user.isVerified ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <span className="text-muted-foreground text-xs">No</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                                                <DropdownMenuSeparator />
                                                
                                                <DropdownMenuLabel>Verification</DropdownMenuLabel>
                                                {user.isVerified ? (
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'verify', false)}>
                                                        <Shield className="mr-2 h-4 w-4 text-red-500" /> Remove Verification
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'verify', true)}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-blue-500" /> Verify User
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuSeparator />
                                                
                                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                                {user.status !== 'ACTIVE' && (
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'status', 'ACTIVE')}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Activate
                                                    </DropdownMenuItem>
                                                )}
                                                {user.status !== 'SUSPENDED' && (
                                                    <DropdownMenuItem onClick={() => handleAction(user.id, 'status', 'SUSPENDED')}>
                                                        <Ban className="mr-2 h-4 w-4 text-yellow-500" /> Suspend
                                                    </DropdownMenuItem>
                                                )}
                                                
                                                <DropdownMenuSeparator />
                                                <DropdownMenuLabel>Role</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'role', 'USER')}>
                                                    Make User
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'role', 'MODERATOR')}>
                                                    Make Moderator
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction(user.id, 'role', 'ADMIN')}>
                                                    Make Admin
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    onClick={() => handleAction(user.id, 'delete')} 
                                                    className="text-red-500 focus:text-red-500"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete User
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 bg-card border border-border p-4 rounded-xl shadow-sm">
                <div className="text-sm font-medium flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-muted-foreground">{totalUsers} {totalUsers === 1 ? 'user' : 'users'} found</span>
                    <span className="text-border mx-1">|</span>
                    <span className="text-foreground font-bold">Page {page} of {totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1 || loading}
                        className="h-9 transition-all active:scale-95"
                    >
                        Previous
                    </Button>
                    <div className="flex items-center justify-center h-9 px-4 border border-border rounded-lg font-bold text-sm bg-muted/40 shadow-inner">
                        {page}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                        className="h-9 transition-all active:scale-95"
                    >
                        Next
                    </Button>
                </div>
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
                                    <AvatarImage src={selectedUser.profile?.avatar} />
                                    <AvatarFallback className="text-2xl">{selectedUser.profile?.name?.charAt(0) || selectedUser.email.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-bold">{selectedUser.profile?.name || 'Unknown'}</h3>
                                <p className="text-sm text-muted-foreground">@{selectedUser.profile?.handle || selectedUser.email}</p>
                                <div className="flex gap-2 mt-2">
                                    {getRoleBadge(selectedUser.role)}
                                    {getStatusBadge(selectedUser.status)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-semibold">Email:</span>
                                    <p className="text-muted-foreground">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Joined:</span>
                                    <p className="text-muted-foreground">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">Verified:</span>
                                    <p className="text-muted-foreground">{selectedUser.isVerified ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <span className="font-semibold">User ID:</span>
                                    <p className="text-muted-foreground truncate" title={selectedUser.id}>{selectedUser.id}</p>
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
