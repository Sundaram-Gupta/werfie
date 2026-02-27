import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Activity, Clock, Gavel, ShieldCheck, AlertTriangle, 
    XOctagon, MessageSquare, PlayCircle, FastForward, CheckCircle2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { debateApi } from '@/services/debate.api';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * Debate View (Split-Screen)
 * Left: Stream / Session Details / Moderator Controls
 * Right: Live Argument Stream / Fact Checking / Voting
 */
const DebateView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();

    const [session, setSession] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [activeRound, setActiveRound] = useState(null);
    // Real-time states
    const [liveStreamDetails, setLiveStreamDetails] = useState({ isLive: false, viewers: 0 });
    const [argumentInput, setArgumentInput] = useState('');
    const [loading, setLoading] = useState(true);

    const streamRef = useRef(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchDebateData = async () => {
            try {
                setLoading(true);
                const sessionData = await debateApi.getSession(id);
                setSession(sessionData);
                setRounds(sessionData.rounds || []);
                
                // Determine active round
                const active = sessionData.rounds?.find(r => r.status === 'active');
                if (active) setActiveRound(active);

            } catch (err) {
                toast.error('Failed to load debate session');
                navigate('/debate');
            } finally {
                setLoading(false);
            }
        };

        fetchDebateData();
    }, [id, navigate]);

    // WebSocket Integration
    useEffect(() => {
        if (!socket || !session) return;

        console.log(`[DebateView] Connecting to live socket for room: ${id}`);
        // The API backend puts this connection on a different namespace or we handle it via the global socket context.
        // Assuming socket context handles namespacing or we emit a subscribe event.
        socket.emit('subscribe', id);

        const handleRoundStart = (newRound) => {
            setRounds(prev => [...prev.filter(r => r.id !== newRound.id), newRound].sort((a,b)=>a.roundNumber - b.roundNumber));
            setActiveRound(newRound);
            setSession(s => ({ ...s, status: 'live' }));
            toast.info(`Round ${newRound.roundNumber} has started.`);
        };

        const handleRoundEnd = (endedRound) => {
            setRounds(prev => prev.map(r => r.id === endedRound.id ? endedRound : r));
            if (activeRound?.id === endedRound.id) setActiveRound(null);
            toast.info(`Round ${endedRound.roundNumber} concluded.`);
        };

        const handleNewArgument = (argument) => {
            // Add argument to its respective round
            setRounds(prev => prev.map(round => {
                if (round.id === argument.roundId) {
                    const exists = round.arguments?.find(a => a.id === argument.id);
                    if (exists) return round;
                    return {
                        ...round,
                        arguments: [...(round.arguments || []), argument]
                    };
                }
                return round;
            }));
            
            // Auto scroll stream
            if (streamRef.current) {
                streamRef.current.scrollTop = streamRef.current.scrollHeight;
            }
        };

        const handleFactCheck = (factCheck) => {
             // Attach factcheck to the respective argument in the round
             setRounds(prev => prev.map(round => ({
                 ...round,
                 arguments: round.arguments?.map(arg => {
                     if (arg.id === factCheck.argumentId) {
                         const exists = arg.factChecks?.find(f => f.id === factCheck.id);
                         if (exists) return arg;
                         return {
                             ...arg,
                             factChecks: [...(arg.factChecks || []), factCheck]
                         };
                     }
                     return arg;
                 })
             })));
             toast.success('New fact-check verified.');
        };

        socket.on('round.started', handleRoundStart);
        socket.on('round.ended', handleRoundEnd);
        socket.on('argument.posted', handleNewArgument);
        socket.on('factcheck.added', handleFactCheck);

        return () => {
            socket.off('round.started', handleRoundStart);
            socket.off('round.ended', handleRoundEnd);
            socket.off('argument.posted', handleNewArgument);
            socket.off('factcheck.added', handleFactCheck);
        };
    }, [socket, session, activeRound, id]);


    // Handlers
    const handlePostArgument = async () => {
        if (!argumentInput.trim() || !activeRound) return;

        try {
            await debateApi.postArgument(activeRound.id, argumentInput);
            setArgumentInput('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to post argument');
        }
    };

    // UI Helpers
    const isModerator = session?.moderatorId === user?.id; // Or Admin
    const isParticipantA = session?.participantAId === user?.id;
    const isParticipantB = session?.participantBId === user?.id;
    const canSpeak = activeRound && (activeRound.speakerId === user?.id);

    // Loading State
    if (loading || !session) {
         return (
             <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4 text-primary">
                     <Activity className="w-10 h-10 animate-pulse" />
                     <p className="font-bold uppercase tracking-widest text-sm text-foreground">Loading Debate Environment...</p>
                 </div>
             </div>
         );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-black sticky top-0 z-50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/debate')}>
                            <XOctagon className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                {session.status === 'live' && (
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] uppercase font-black tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        Protocol Active
                                    </div>
                                )}
                                <h1 className="font-black italic uppercase tracking-tight text-xl">{session.title}</h1>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground line-clamp-1">{session.topic}</p>
                        </div>
                    </div>
                    {/* Role Indicators */}
                    <div className="hidden md:flex items-center gap-4">
                        {isModerator && <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Moderator Access</Badge>}
                        {(isParticipantA || isParticipantB) && <Badge variant="outline">Participant Access</Badge>}
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-white/5 rounded-full px-4 py-1.5 border border-white/5">
                            <Clock className="w-4 h-4" />
                            {format(new Date(), 'HH:mm:ss')}
                        </div>
                    </div>
                </div>
            </header>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[calc(100vh-80px)] overflow-hidden">
                
                {/* ------------------------------------------------------------- */}
                {/* LEFT PANEL: Context, Video Stream (Optional), Intel, Controls */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-4 border-r border-white/10 bg-[#0a0a0a] overflow-y-auto p-6 space-y-8 flex flex-col pt-[8rem] pb-[10rem]">
                    
                    {/* Video / Stream Placeholder */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Live Feed</h3>
                        <Card className="aspect-video bg-black border-white/10 flex items-center justify-center relative overflow-hidden group">
                           {session.status === 'live' ? (
                               <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 w-full h-full">
                                    <Activity className="w-12 h-12 text-muted-foreground animate-pulse" />
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Awaiting Video Upstream</p>
                               </div>
                           ) : (
                               <div className="text-center text-muted-foreground space-y-2">
                                    <PlayCircle className="w-10 h-10 mx-auto opacity-50" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Stream Offline</p>
                               </div>
                           )}
                        </Card>
                    </div>

                    {/* Debate Intel */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Session Intel</h3>
                        <Card className="p-4 bg-black border-white/10 space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Rounds</p>
                                <p className="font-mono">{session.totalRounds} Structured Passes</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Round Duration</p>
                                <p className="font-mono">{session.roundDurationMinutes} Minutes per sequence</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Participants</p>
                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between text-sm bg-white/5 p-2 rounded-md">
                                        <span className="font-medium text-primary">Side A (Affirmative)</span>
                                        <span className="text-muted-foreground text-xs">{session.participantAId?.substring(0,8)}...</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm bg-white/5 p-2 rounded-md">
                                        <span className="font-medium text-red-400">Side B (Opposition)</span>
                                        <span className="text-muted-foreground text-xs">{session.participantBId?.substring(0,8)}...</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Moderator Controls */}
                    {isModerator && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">Moderator Override</h3>
                            <Card className="bg-primary/5 border-primary/20 p-4 space-y-3">
                                {session.status === 'scheduled' && (
                                    <Button className="w-full font-bold uppercase tracking-widest text-xs" onClick={() => {/* API call to change status to live */}}>
                                        <FastForward className="w-4 h-4 mr-2" />
                                        Initialize Debate Protocol
                                    </Button>
                                )}
                                {session.status === 'live' && !activeRound && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-medium mb-3">No active sequence. Initiate the next round explicitly.</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1 text-xs" onClick={() => {/* Start round A */}}>Start P-A</Button>
                                            <Button variant="outline" className="flex-1 text-xs border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => {/* Start round B */}}>Start P-B</Button>
                                        </div>
                                    </div>
                                )}
                                {activeRound && (
                                    <Button variant="destructive" className="w-full font-bold uppercase tracking-widest text-xs" onClick={() => {/* Force end round */}}>
                                        <XOctagon className="w-4 h-4 mr-2" />
                                        Force End Round
                                    </Button>
                                )}
                                {session.status === 'live' && (
                                    <Button variant="outline" className="w-full font-bold uppercase tracking-widest text-xs border-white/10 mt-2" onClick={() => {/* Conclude session */}}>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Conclude Session
                                    </Button>
                                )}
                            </Card>
                        </div>
                    )}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* RIGHT PANEL: Live Argument Stream & Fact Checks               */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-8 flex flex-col h-full bg-[#111] relative pb-[10rem] pt-[8rem] lg:pt-[10rem] lg:pb-[15rem]">
                    
                    {/* Active Round Info Banner */}
                    {activeRound ? (
                        <div className="absolute top-0 left-0 right-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="font-bold text-sm tracking-widest uppercase">
                                    Round {activeRound.roundNumber} Active
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Floor Access:</span>
                                <Badge variant="outline" className="bg-white/5">
                                    {activeRound.speakerId === session.participantAId ? 'Affirmative' : 'Opposition'}
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 border-b border-white/5 p-4 flex justify-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Awaiting Next Sequence
                        </div>
                    )}

                    {/* Argument Stream Area */}
                    <ScrollArea ref={streamRef} className="flex-1 p-6 relative">
                        {rounds.map((round) => (
                            <div key={round.id} className="mb-12 space-y-6">
                                {/* Round Header */}
                                <div className="flex items-center gap-4 py-2 border-b border-white/10">
                                    <span className="font-black italic text-lg opacity-50 uppercase tracking-tight">Round {round.roundNumber}</span>
                                    <div className="h-px bg-white/5 flex-1" />
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Speaker: {round.speakerId?.substring(0,8)}...
                                    </span>
                                </div>

                                {/* Arguments */}
                                <div className="space-y-4">
                                    {(!round.arguments || round.arguments.length === 0) && round.status === 'active' && (
                                        <div className="text-center py-6 text-muted-foreground text-sm font-medium italic">
                                            Awaiting speaker input...
                                        </div>
                                    )}
                                    {round.arguments?.map((arg) => (
                                        <div key={arg.id} className={`flex flex-col gap-2 ${arg.speakerId === session.participantBId ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-4 rounded-2xl ${
                                                arg.speakerId === session.participantBId 
                                                    ? 'bg-red-500/10 border border-red-500/20 text-red-50 rounded-tr-sm' 
                                                    : 'bg-primary/10 border border-primary/20 text-primary-foreground rounded-tl-sm'
                                            }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{arg.argumentText}</p>
                                                <span className="text-[10px] opacity-50 mt-2 block font-mono">
                                                    {format(new Date(arg.timestamp), 'HH:mm:ss')}
                                                </span>
                                            </div>

                                            {/* Fact Checks associated with this argument */}
                                            {arg.factChecks && arg.factChecks.length > 0 && (
                                                <div className="ml-4 mr-4 space-y-2 mt-1 w-full max-w-[80%]">
                                                    {arg.factChecks.map(fc => (
                                                        <Card key={fc.id} className="bg-black/50 border-blue-500/30 p-3 flex items-start gap-3">
                                                            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Fact Check: {fc.verificationStatus}</p>
                                                                <p className="text-sm text-foreground">{fc.notes}</p>
                                                                {fc.referenceUrl && (
                                                                    <a href={fc.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 mt-2">
                                                                        [Source: {fc.referenceTitle || 'Link'}]
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </ScrollArea>

                    {/* Input Area (Only visible if the user can speak in the active round) */}
                    {canSpeak && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-white/10 z-20">
                            <div className="max-w-4xl mx-auto flex items-end gap-4 relative">
                                <Textarea 
                                    placeholder="Enter your argument. This will be recorded in the transcript."
                                    className="resize-none bg-[#111] border-white/20 focus-visible:ring-primary min-h-[80px]"
                                    value={argumentInput}
                                    onChange={(e) => setArgumentInput(e.target.value)}
                                    disabled={!activeRound || new Date() > new Date(activeRound.endTime)}
                                />
                                <Button 
                                    className="h-[80px] w-[80px] font-black uppercase tracking-widest shrink-0" 
                                    onClick={handlePostArgument}
                                    disabled={!argumentInput.trim()}
                                >
                                    <MessageSquare className="w-6 h-6" />
                                </Button>
                                {/* Active round countdown could go here */}
                            </div>
                        </div>
                    )}

                    {(!canSpeak && activeRound) && (
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-white/10 z-20 text-center">
                             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Read-Only Mode: Opponent holds the floor
                             </p>
                         </div>
                    )}
                    
                    {(!activeRound && session.status === 'live') && (
                         <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-md border-t border-white/10 z-20 text-center">
                             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                Protocol Paused. Awaiting Moderator to start next sequence.
                             </p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebateView;
