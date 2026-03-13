import React, { useState } from 'react';
import { 
    ShieldAlert, 
    Plus, 
    Save, 
    X, 
    Mic2, 
    Play, 
    Square, 
    Clock, 
    Calendar,
    Video,
    Send,
    Loader2
} from 'lucide-react';
import { soapboxApi } from '@/services/soapbox.api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

const SoapboxAdmin = ({ onSessionCreated }) => {
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        durationMinutes: 30,
        videoUrl: '',
        institutionId: '' // Will be resolved by backend or passed from context
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const session = await soapboxApi.createSession(formData);
            toast.success('Soapbox Session Scheduled');
            setShowCreate(false);
            if (onSessionCreated) onSessionCreated(session);
        } catch (err) {
            toast.error('Failed to schedule session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold uppercase tracking-tight italic">Soapbox Command Center</h2>
                </div>
                {!showCreate && (
                    <Button onClick={() => setShowCreate(true)} className="rounded-full bg-primary hover:bg-primary/90 text-black font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule New Session
                    </Button>
                )}
            </div>

            {showCreate && (
                <Card className="p-6 bg-[#111] border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Session Parameters
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Session Title</label>
                                <Input 
                                    required
                                    placeholder="e.g. State of the Economy Address"
                                    className="bg-black border-white/10 focus:border-primary/50"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Institution ID (Manual Override)</label>
                                <Input 
                                    placeholder="Leave blank for auto-resolve"
                                    className="bg-black border-white/10"
                                    value={formData.institutionId}
                                    onChange={e => setFormData({...formData, institutionId: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Executive Description</label>
                            <Textarea 
                                required
                                placeholder="Core themes and objectives of this statement..."
                                className="bg-black border-white/10 min-h-[100px]"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Scheduled Start</label>
                                <Input 
                                    required
                                    type="datetime-local"
                                    className="bg-black border-white/10"
                                    value={formData.startTime}
                                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Duration (Minutes)</label>
                                <Input 
                                    required
                                    type="number"
                                    className="bg-black border-white/10"
                                    value={formData.durationMinutes}
                                    onChange={e => setFormData({...formData, durationMinutes: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Video Feed URL</label>
                                <Input 
                                    type="url"
                                    placeholder="https://..."
                                    className="bg-black border-white/10"
                                    value={formData.videoUrl}
                                    onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading} className="rounded-full bg-primary hover:bg-primary/90 text-black font-bold px-8">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Initialize Session
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </div>
    );
};

export const SoapboxSessionTools = ({ session, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [statement, setStatement] = useState('');

    const handleStart = async () => {
        setLoading(true);
        try {
            const updated = await soapboxApi.startSession(session.id);
            toast.success('Session is now LIVE');
            if (onUpdate) onUpdate(updated);
        } catch (err) {
            toast.error('Failed to start session');
        } finally {
            setLoading(false);
        }
    };

    const handleEnd = async () => {
        setLoading(true);
        try {
            const updated = await soapboxApi.endSession(session.id);
            toast.info('Session ended and archived');
            if (onUpdate) onUpdate(updated);
        } catch (err) {
            toast.error('Failed to end session');
        } finally {
            setLoading(false);
        }
    };

    const handlePostStatement = async () => {
        if (!statement.trim()) return;
        setLoading(true);
        try {
            await soapboxApi.addStatement(session.id, {
                speakerId: 'OFFICIAL_VOICE', // Or user handle
                content: statement
            });
            setStatement('');
            toast.success('Statement Broadcasted');
        } catch (err) {
            toast.error('Broadcast failure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-6 bg-black border-primary/30 shadow-[0_0_20px_rgba(255,100,0,0.1)]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", session.status === 'live' ? "bg-red-500 animate-pulse" : "bg-white/20")} />
                    <span className="text-xs font-black uppercase tracking-widest italic">Live Control Deck</span>
                </div>
                <div className="flex gap-2">
                    {session.status === 'scheduled' && (
                        <Button size="sm" onClick={handleStart} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6">
                            <Play className="w-4 h-4 mr-2" /> Start Session
                        </Button>
                    )}
                    {session.status === 'live' && (
                        <Button size="sm" onClick={handleEnd} disabled={loading} variant="destructive" className="rounded-full px-6">
                            <Square className="w-4 h-4 mr-2" /> End Session
                        </Button>
                    )}
                </div>
            </div>

            {session.status === 'live' && (
                <div className="space-y-4">
                    <div className="relative">
                        <Textarea 
                            placeholder="Type the official statement here... (Locked and Structured)"
                            className="bg-[#111] border-white/10 min-h-[120px] pb-12 focus-visible:ring-primary/20"
                            value={statement}
                            onChange={e => setStatement(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-3">
                            <span className="text-[10px] text-muted-foreground font-mono">CHARS: {statement.length}</span>
                            <Button 
                                size="sm" 
                                disabled={loading || !statement.trim()} 
                                onClick={handlePostStatement}
                                className="rounded-full bg-primary hover:bg-primary/90 text-black font-bold h-8"
                            >
                                <Send className="w-3 h-3 mr-2" />
                                Broadcast
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {session.status !== 'live' && (
                <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-2xl border border-white/5">
                    <Mic2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium uppercase tracking-widest">
                        Transmission {session.status === 'completed' ? 'Offline' : 'Ready'}
                    </p>
                </div>
            )}
        </Card>
    );
};

export default SoapboxAdmin;
