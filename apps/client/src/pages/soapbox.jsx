import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Mic2, 
    Play, 
    Calendar, 
    History, 
    TrendingUp, 
    Search,
    ChevronRight,
    Users,
    Clock,
    ShieldAlert
} from 'lucide-react';
import { soapboxApi } from '@/services/soapbox.api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SoapboxAdmin, { SoapboxSessionTools } from '@/components/soapbox/SoapboxAdmin';

const SoapboxLanding = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, live, scheduled, completed
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSessions = async () => {
        try {
            const data = await soapboxApi.listSessions();
            setSessions(data);
        } catch (err) {
            toast.error('Failed to load soapbox sessions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const filteredSessions = sessions.filter(s => {
        const matchesFilter = filter === 'all' || s.status === filter;
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const liveSessions = sessions.filter(s => s.status === 'live');
    const scheduledSessions = sessions.filter(s => s.status === 'scheduled');

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-12">
                    <div className="relative z-10 max-w-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/20 rounded-2xl">
                                <Mic2 className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Soapbox Mode</h1>
                        </div>
                        <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                            Official source-of-record statement platform. Structured communication, timed delivery, and verified accountability.
                        </p>
                        <div className="flex gap-4">
                            <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-black font-bold px-8">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Interactive Archive
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full border-white/10 px-8">
                                Learn about Enforcement
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Admin Section (Conditional) */}
                {user?.role === 'ADMIN' || user?.institutionalProfile && (
                    <SoapboxAdmin onSessionCreated={fetchSessions} />
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Listings */}
                    <div className="lg:col-span-12 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                {['all', 'live', 'scheduled', 'completed'].map((f) => (
                                    <Button 
                                        key={f}
                                        variant={filter === f ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setFilter(f)}
                                        className={cn(
                                            "rounded-full px-6 uppercase text-[10px] font-black tracking-widest",
                                            filter === f ? "bg-primary text-black" : "text-muted-foreground"
                                        )}
                                    >
                                        {f}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search statements..." 
                                    className="pl-10 bg-white/5 border-white/10 rounded-full h-10 text-xs"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredSessions.map(session => (
                                <Link key={session.id} to={`/soapbox/${session.id}`}>
                                    <Card className="group p-6 bg-[#111] border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={session.status === 'live' ? 'destructive' : 'outline'} className="rounded-full uppercase text-[9px] font-black px-3 py-0.5 tracking-widest">
                                                        {session.status}
                                                    </Badge>
                                                    <span className="text-[10px] font-mono text-muted-foreground">ID: {session.id.slice(0, 8)}</span>
                                                </div>
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{session.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{session.description}</p>
                                                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {format(new Date(session.startTime), 'MMM d, p')}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {session.durationMinutes} MINS
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-3.5 h-3.5" />
                                                        {session._count?.statements || 0} MESSAGES
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                                                <ChevronRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}

                            {filteredSessions.length === 0 && (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        <Search className="w-8 h-8 text-white/20" />
                                    </div>
                                    <p className="text-muted-foreground font-medium italic">No sessions found matching your transparency filters.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SoapboxLanding;
