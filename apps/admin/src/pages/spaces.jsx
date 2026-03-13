import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { spaceService } from '@/services/spaceService';
import { Radio, Mic, MoreVertical, Trash2, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

export default function SpacesPage() {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSpaces = useCallback(async () => {
        setLoading(true);
        try {
            const data = await spaceService.getAllSpaces();
            setSpaces(data || []);
        } catch (error) {
            console.error("Failed to fetch spaces", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    useRefreshOnFocus(fetchSpaces);

    const handleCancelSpace = async (id) => {
        try {
            await spaceService.cancelSpace(id);
            await fetchSpaces();
        } catch (error) {
            console.error("Failed to cancel space", error);
        }
    };

    if (loading) return <div>Loading Spaces...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white/90">Audio Spaces</h1>
                    <p className="text-gray-400">Monitor and manage live audio conversations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.length === 0 ? (
                    <div className="text-gray-400 col-span-3 text-center py-12">No active spaces found.</div>
                ) : (
                    spaces.map((space) => (
                        <Card key={space.id} className="bg-[#151516] border-white/5">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <Badge className={space.status === 'live' ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-blue-500/20 text-blue-500"}>
                                    {space.status === 'live' ? <Radio className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                                    {space.status.toUpperCase()}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#1a1a1c] border-white/10 text-white">
                                        <DropdownMenuItem className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer" onClick={() => handleCancelSpace(space.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> End Space
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">
                                            <Ban className="mr-2 h-4 w-4" /> Block Host
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <h3 className="text-lg font-bold text-white mb-1 truncate">{space.title}</h3>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-6 w-6 rounded-full bg-gray-700 overflow-hidden">
                                        {space.host?.profile?.avatar ? (
                                            <img src={space.host.profile.avatar} alt={space.host.email} className="h-full w-full object-cover" />
                                        ) : (
                                           <div className="h-full w-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                                               {space.host?.email?.charAt(0).toUpperCase()}
                                           </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-400 truncate">Host: {space.host?.profile?.name || space.host?.email}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {space.topics && space.topics.map((topic, i) => (
                                        <span key={i} className="text-xs bg-white/5 border border-white/5 px-2 py-1 rounded-full text-gray-300">
                                            #{topic}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 text-xs text-gray-500">
                                    {space.scheduledAt && <p>Scheduled: {format(new Date(space.scheduledAt), 'PP p')}</p>}
                                    {space.createdAt && <p>Created: {format(new Date(space.createdAt), 'PP p')}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
