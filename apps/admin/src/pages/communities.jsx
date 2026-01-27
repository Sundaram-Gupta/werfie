import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const initialCommunities = [
    { id: 1, name: 'Tech Enthusiasts', members: 12500, status: true, created: '2024-01-15' },
    { id: 2, name: 'Art Gallery', members: 8400, status: true, created: '2024-02-10' },
    { id: 3, name: 'Crypto News', members: 45000, status: false, created: '2023-11-05' },
    { id: 4, name: 'Music Lovers', members: 1200, status: true, created: '2025-01-02' },
    { id: 5, name: 'Local Events', members: 560, status: true, created: '2025-02-20' },
];

export default function CommunitiesPage() {
    const [communities, setCommunities] = useState(initialCommunities);

    const toggleCommunity = (id) => {
        setCommunities(communities.map(c =>
            c.id === id ? { ...c, status: !c.status } : c
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
                <Button>Create Community</Button>
            </div>

            <div className="rounded-xl glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Community</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {communities.map((community) => (
                            <TableRow key={community.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{community.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {community.name}
                                    </div>
                                </TableCell>
                                <TableCell>{community.members.toLocaleString()}</TableCell>
                                <TableCell>{community.created}</TableCell>
                                <TableCell>
                                    <Badge variant={community.status ? 'default' : 'secondary'}>
                                        {community.status ? 'Active' : 'Disabled'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Switch
                                        checked={community.status}
                                        onCheckedChange={() => toggleCommunity(community.id)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
