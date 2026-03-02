import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
    Timer, 
    Mic2, 
    ShieldAlert, 
    Users, 
    Clock, 
    FileText, 
    MessageSquare, 
    Activity,
    ChevronRight,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { soapboxApi } from '@/services/soapbox.api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SoapboxView = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [statements, setStatements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const data = await soapboxApi.getSession(id);
                setSession(data);
                setStatements(data.statements || []);
            } catch (err) {
                toast.error('Failed to load session details');
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const token = localStorage.getItem('accessToken');
        const soapboxSocket = io(`${API_BASE_URL}/soapbox-live`, {
            path: '/ws/soapbox-live',
            auth: { token }
        });

        socketRef.current = soapboxSocket;

        soapboxSocket.on('connect', () => {
            console.log('📡 Soapbox Live Connected');
            soapboxSocket.emit('subscribe', id);
        });

        soapboxSocket.on('soapbox.started', (updatedSession) => {
            if (updatedSession.id === id) {
                setSession(updatedSession);
                toast.success('Live Session Started!');
            }
        });

        soapboxSocket.on('soapbox.statement_added', (statement) => {
            if (statement.sessionId === id) {
                setStatements(prev => [...prev, statement]);
            }
        });

        soapboxSocket.on('soapbox.ended', (updatedSession) => {
            if (updatedSession.id === id) {
                setSession(updatedSession);
                toast.info('Live Session Completed');
            }
        });

        return () => {
            soapboxSocket.disconnect();
        };
    }, [id]);

    useEffect(() => {
        if (!session?.countdownEndTime || session.status !== 'live') return;

        const interval = setInterval(() => {
            const end = new Date(session.countdownEndTime).getTime();
            const now = new Date().getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('00:00');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [session?.countdownEndTime, session?.status]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black">
            <div className="flex flex-col items-center gap-4">
                <Activity className="w-12 h-12 text-primary animate-pulse" />
                <p className="text-muted-foreground animate-pulse">Initializing Secure Statement Feed...</p>
            </div>
        </div>
    );

    if (!session) return (
        <div className="p-10 text-center">
            <h1 className="text-2xl font-bold">Session not found</h1>
            <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-primary" />
                                <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Official Soapbox Session</span>
                            </div>
                            <h1 className="text-3xl font-black tracking-tight uppercase italic">{session.title}</h1>
                            <p className="text-muted-foreground font-medium">{session.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {session.status === 'live' ? (
                                <div className="flex items-center gap-4 p-1 px-4 bg-red-500/10 border border-red-500/20 rounded-full animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-sm font-black text-red-500 uppercase tracking-widest">LIVE</span>
                                    <div className="w-px h-4 bg-red-500/20" />
                                    <div className="flex items-center gap-2 font-mono text-xl font-bold text-red-500">
                                        <Timer className="w-5 h-5" />
                                        {timeLeft}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">{session.status}</span>
                                </div>
                            )}
                            
                            <Button variant="ghost" className="rounded-full border border-white/10">
                                <Users className="w-4 h-4 mr-2" />
                                {session._count?.statements || statements.length} Participants
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-12 space-y-8">
                        {session.status === 'live' || session.status === 'completed' || session.status === 'archived' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <Mic2 className="w-5 h-5 text-primary" />
                                        Statement Stream
                                    </h2>
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Chronological Order</span>
                                </div>

                                <div className="space-y-4">
                                    {statements.map((s, idx) => (
                                        <div key={s.id} className="relative group">
                                            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                                            <Card className="p-6 bg-[#111] border-white/5 hover:border-primary/30 transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                                                        </div>
                                                        <span className="font-bold text-sm">Official Speaker</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{format(new Date(s.timestamp), 'HH:mm:ss')}</span>
                                                </div>
                                                <p className="text-[17px] leading-relaxed font-medium text-white/90">
                                                    {s.content}
                                                </p>
                                            </Card>
                                        </div>
                                    ))}

                                    {session.status === 'live' && (
                                        <div className="p-10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                            <p className="text-sm text-muted-foreground font-medium">Session in progress. Awaiting next statement...</p>
                                        </div>
                                    )}

                                    {statements.length === 0 && session.status !== 'live' && (
                                        <div className="p-20 text-center space-y-4">
                                            <Activity className="w-12 h-12 text-white/10 mx-auto" />
                                            <p className="text-muted-foreground">No statements recorded for this session.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 text-center bg-[#111] rounded-3xl border border-white/5 space-y-6">
                                <Clock className="w-16 h-16 text-primary mx-auto animate-pulse" />
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold uppercase italic">Session Scheduled</h2>
                                    <p className="text-muted-foreground">This session is scheduled to start at {format(new Date(session.startTime), 'PPP p')}</p>
                                </div>
                                <Button className="rounded-full px-8">Set Reminder</Button>
                            </div>
                        )}

                        {/* Post Session Content */}
                        {(session.status === 'completed' || session.status === 'archived') && (
                            <div className="mt-12">
                                <Tabs defaultValue="transcript" className="w-full">
                                    <TabsList className="bg-black/50 border border-white/5 p-1 rounded-full h-12">
                                        <TabsTrigger value="transcript" className="rounded-full px-8 data-[state=active]:bg-primary">Transcript</TabsTrigger>
                                        <TabsTrigger value="summary" className="rounded-full px-8 data-[state=active]:bg-primary">AI Summary</TabsTrigger>
                                        <TabsTrigger value="rebuttals" className="rounded-full px-8 data-[state=active]:bg-primary">Rebuttals</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="transcript" className="mt-8">
                                        <Card className="p-8 bg-black/40 border-white/5">
                                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
                                                {session.transcriptText || 'Transcript is being generated...'}
                                            </pre>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="summary" className="mt-8">
                                        <Card className="p-8 bg-black/40 border-white/5 space-y-4">
                                            <div className="flex items-center gap-2 text-primary">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <h3 className="font-bold uppercase tracking-widest text-sm">Automated Executive Summary</h3>
                                            </div>
                                            <p className="text-lg leading-relaxed text-white/90 italic">
                                                "{session.aiSummary}"
                                            </p>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="rebuttals" className="mt-8">
                                        <div className="space-y-6">
                                            <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="font-bold">Rebuttal Window Active</h3>
                                                    <p className="text-xs text-muted-foreground">Only verified institutions can post structured rebuttals.</p>
                                                </div>
                                                <Button size="sm" className="rounded-full bg-primary text-black font-bold">Submit Response</Button>
                                            </div>

                                            {session.rebuttals?.map(r => (
                                                <Card key={r.id} className="p-6 bg-[#111] border-white/5">
                                                    <div className="flex justify-between mb-4">
                                                        <span className="text-xs font-bold text-primary uppercase">Institutional Response</span>
                                                        <span className="text-[10px] text-muted-foreground">{format(new Date(r.submittedAt), 'PPP')}</span>
                                                    </div>
                                                    <p className="text-sm text-white/80 leading-relaxed">{r.rebuttalText}</p>
                                                </Card>
                                            ))}

                                            {(!session.rebuttals || session.rebuttals.length === 0) && (
                                                <div className="p-10 text-center">
                                                    <p className="text-muted-foreground text-sm italic">No rebuttals have been approved yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SoapboxView;
