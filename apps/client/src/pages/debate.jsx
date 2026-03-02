import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Gavel, 
    Search, 
    Activity, 
    Clock, 
    CheckCircle2, 
    ShieldAlert, 
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { debateApi } from '@/services/debate.api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from '@/context/AuthContext';
import { Timer } from 'lucide-react';

/**
 * Debate Landing Page
 * Lists active, scheduled, and past institutional debates.
 */
const DebateLanding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [filter, setFilter] = useState('all'); // 'all', 'live', 'scheduled', 'completed'
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        topic: '',
        participantAId: '',
        participantBId: '',
        roundDurationMinutes: 5,
        totalRounds: 3
    });

    const isAuthorizedIssuer = user?.role === 'admin' || user?.profile?.verified || user?.institutionalProfile?.isVerified;

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoading(true);
                const queryFilter = filter === 'all' ? {} : { status: filter };
                const data = await debateApi.listSessions(queryFilter);
                setSessions(data);
            } catch (err) {
                toast.error('Failed to load debate sessions');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, [filter]);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await debateApi.createSession(createForm);
            setSessions([data, ...sessions]);
            setIsCreateModalOpen(false);
            toast.success('Debate framework successfully provisioned.');
            setCreateForm({
                title: '',
                topic: '',
                participantAId: '',
                participantBId: '',
                roundDurationMinutes: 5,
                totalRounds: 3
            });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to initialize debate structure');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'live': return <Activity className="w-4 h-4 text-red-500 animate-pulse" />;
            case 'scheduled': return <Clock className="w-4 h-4 text-primary" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status) => {
        const baseClass = "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 border w-fit";
        
        switch (status) {
            case 'live':
                return (
                    <div className={`${baseClass} bg-red-500/10 border-red-500/30 text-red-500`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live Now
                    </div>
                );
            case 'scheduled':
                return (
                    <div className={`${baseClass} bg-primary/10 border-primary/30 text-primary`}>
                        Scheduled
                    </div>
                );
            case 'completed':
            case 'archived':
                return (
                    <div className={`${baseClass} bg-white/5 border-white/10 text-muted-foreground`}>
                        Historical Record
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
            {/* Header Structure */}
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Gavel className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-black uppercase tracking-tight italic">
                            Global Debate Framework
                        </h1>
                    </div>
                    <p className="text-muted-foreground max-w-2xl font-medium leading-relaxed">
                        Moderated, time-boxed institutional debates. The Global Debate Framework ensures structured arguments, real-time fact-checking layers, and a publicly verifiable transcript record to combat misinformation.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/5">
                    <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
                        <TabsList className="bg-black border border-white/5 p-1 rounded-2xl h-12 w-full md:w-auto overflow-x-auto justify-start">
                            <TabsTrigger value="all" className="rounded-xl px-6 data-[state=active]:bg-white/10">All Records</TabsTrigger>
                            <TabsTrigger value="live" className="rounded-xl px-6 data-[state=active]:bg-white/10">
                                <span className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Live
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="scheduled" className="rounded-xl px-6 data-[state=active]:bg-white/10">Scheduled</TabsTrigger>
                            <TabsTrigger value="completed" className="rounded-xl px-6 data-[state=active]:bg-white/10">Historical</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {isAuthorizedIssuer && (
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 rounded-xl px-6 h-12 shadow-inner">
                                    <ShieldAlert className="w-4 h-4 mr-2" />
                                    Propose Debate
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] bg-[#111] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">Initialize Debate Frame</DialogTitle>
                                    <DialogDescription className="text-muted-foreground flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-primary" />
                                        Verified institutions and administrators only.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Session Title</label>
                                        <input 
                                            required
                                            type="text"
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-sm"
                                            placeholder="e.g. Future of Digital Governance"
                                            value={createForm.title}
                                            onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Core Topic</label>
                                        <textarea 
                                            required
                                            className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-sm min-h-[80px] resize-none"
                                            placeholder="What is the central question..."
                                            value={createForm.topic}
                                            onChange={(e) => setCreateForm({...createForm, topic: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary">Affirmative ID (A)</label>
                                            <input 
                                                required
                                                type="text"
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-sm"
                                                placeholder="User ID"
                                                value={createForm.participantAId}
                                                onChange={(e) => setCreateForm({...createForm, participantAId: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-red-500">Opposition ID (B)</label>
                                            <input 
                                                required
                                                type="text"
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-sm"
                                                placeholder="User ID"
                                                value={createForm.participantBId}
                                                onChange={(e) => setCreateForm({...createForm, participantBId: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                         <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rounds</label>
                                            <input 
                                                required
                                                type="number"
                                                min="1" max="10"
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-sm"
                                                value={createForm.totalRounds}
                                                onChange={(e) => setCreateForm({...createForm, totalRounds: parseInt(e.target.value)})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duration (Mins)</label>
                                            <input 
                                                required
                                                type="number"
                                                min="1" max="60"
                                                className="w-full bg-black border border-white/10 rounded-lg p-3 outline-none focus:border-primary transition-colors text-sm"
                                                value={createForm.roundDurationMinutes}
                                                onChange={(e) => setCreateForm({...createForm, roundDurationMinutes: parseInt(e.target.value)})}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full font-black uppercase tracking-widest mt-6">
                                        Deploy Framework
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Session Listings */}
                {loading ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <Activity className="w-8 h-8 text-primary animate-pulse" />
                        <p className="text-muted-foreground uppercase font-bold tracking-widest text-sm">Fetching Framework Records...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-20 text-center bg-black/50 border border-white/5 rounded-3xl space-y-4">
                        <Search className="w-10 h-10 text-white/20 mx-auto" />
                        <p className="text-muted-foreground font-medium">No debates found matching the current filter criteria.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {sessions.map((session) => (
                            <Card 
                                key={session.id} 
                                className="p-6 md:p-8 bg-[#111] border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                                onClick={() => navigate(`/debate/${session.id}`)}
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left: Status & Intel */}
                                    <div className="md:w-64 shrink-0 space-y-4">
                                        {getStatusBadge(session.status)}
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Topic</p>
                                            <p className="text-sm font-medium line-clamp-2">{session.topic}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Scheduled</p>
                                            <p className="text-sm font-medium">
                                                {session.startTime ? format(new Date(session.startTime), 'PPP p') : 'TBA'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center: Main Details */}
                                    <div className="flex-1 space-y-4 md:border-l md:border-white/5 md:pl-6">
                                        <h2 className="text-2xl font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">
                                            {session.title}
                                        </h2>
                                        
                                        <div className="flex items-center gap-4 text-sm font-bold bg-black/50 p-4 rounded-2xl border border-white/5 w-fit">
                                            <span>Participant A</span>
                                            <div className="px-3 py-1 bg-white/10 rounded-md text-[10px] text-muted-foreground uppercase tracking-widest">VS</div>
                                            <span>Participant B</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                                <Timer className="w-4 h-4" />
                                                <span>{session.totalRounds} Rounds ({session.roundDurationMinutes}m each)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: CTA */}
                                    <div className="shrink-0 flex items-center justify-end">
                                        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebateLanding;
