import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
    ShieldAlert, 
    History, 
    Video, 
    AlertCircle, 
    Map as MapIcon, 
    Layers, 
    Filter,
    Activity,
    Users,
    ChevronRight,
    Search
} from 'lucide-react';
import { toast } from 'sonner';

import CrisisMap from '@/components/crisis/CrisisMap';
import CrisisTimeline from '@/components/crisis/CrisisTimeline';
import CrisisAdminPanel from '@/components/crisis/CrisisAdminPanel';
import { getCrises, getCrisisDetail } from '@/services/crisis.api';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CrisisCommand = () => {
    const { user } = useAuth();
    const [crises, setCrises] = useState([]);
    const [selectedCrisis, setSelectedCrisis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const socketRef = useRef(null);

    // Initial Fetch
    useEffect(() => {
        const fetchCrises = async () => {
            try {
                const data = await getCrises({ status: 'active' });
                setCrises(data);
                if (data.length > 0) {
                    setSelectedCrisis(data[0]);
                }
            } catch (error) {
                toast.error('Failed to fetch operational data');
            } finally {
                setLoading(false);
            }
        };
        fetchCrises();
    }, []);

    // WebSocket Integration
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        socketRef.current = io(API_BASE_URL, {
            path: '/ws/live',
            auth: { token }
        });

        const crisisNsp = socketRef.current.io.opts.path + '/crisis-live'; 
        // Note: socket.io-client namespaces are handled via io(url + '/nsp')
        const crisisSocket = io(`${API_BASE_URL}/crisis-live`, {
            path: '/ws/live',
            auth: { token }
        });

        crisisSocket.on('connect', () => console.log('📡 Crisis Live Connected'));
        
        crisisSocket.on('crisis.created', (newCrisis) => {
            setCrises(prev => [newCrisis, ...prev]);
            toast.info(`NEW CRISIS DETECTED: ${newCrisis.title}`);
        });

        crisisSocket.on('crisis.alert', (newCrisis) => {
            setCrises(prev => [newCrisis, ...prev]);
            toast.error(`CRITICAL ALERT: ${newCrisis.title}`, { duration: 10000 });
        });

        crisisSocket.on('crisis.updated', (updated) => {
            setCrises(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            if (selectedCrisis?.id === updated.id) {
                setSelectedCrisis(prev => ({ ...prev, ...updated }));
            }
        });

        return () => {
            crisisSocket.disconnect();
        };
    }, [selectedCrisis?.id]);

    const handleSelectCrisis = async (crisis) => {
        try {
            const detail = await getCrisisDetail(crisis.id);
            setSelectedCrisis(detail);
        } catch (error) {
            setSelectedCrisis(crisis);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-red-500 animate-pulse" />
                    <h1 className="text-xl font-bold tracking-widest uppercase">Initializing Operational View...</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            {/* Command Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Crisis Command <span className="text-slate-500 font-normal">v2.0</span></h1>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE OPS</span>
                            <span>•</span>
                            <span>{crises.length} ACTIVE INCIDENTS</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                        <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/10 text-white">Dashboard</button>
                        <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white transition-colors">Reports</button>
                    </div>
                    
                    {user?.role === 'ADMIN' && (
                        <button 
                            onClick={() => setShowAdmin(!showAdmin)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${showAdmin ? 'bg-white text-black' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                        >
                            {showAdmin ? 'View Incident' : 'Operational Control'}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT: MAP VIEW (70%) */}
                <div className="flex-1 relative">
                    <CrisisMap 
                        crises={crises} 
                        selectedCrisis={selectedCrisis} 
                        onSelectCrisis={handleSelectCrisis} 
                    />
                    
                    {/* Floating Overlay for Search/Filters */}
                    <div className="absolute top-6 left-6 z-[1000] space-y-4 w-64 pointer-events-none">
                        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
                             <div className="relative mb-3">
                                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search region or event..." 
                                    className="w-full bg-black/50 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50"
                                />
                             </div>
                             <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-[10px] text-slate-300 font-bold transition-colors">
                                    <Filter className="w-3 h-3" /> CATEGORY
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-[10px] text-slate-300 font-bold transition-colors">
                                    <Layers className="w-3 h-3" /> LAYERS
                                </button>
                             </div>
                        </div>

                        {/* Recent Alerts Feed */}
                        <div className="pointer-events-auto bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl max-h-64 overflow-y-auto hidden md:block">
                            <h3 className="text-[10px] text-slate-500 uppercase font-bold mb-3 flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-red-500" /> Flash Alerts
                            </h3>
                            <div className="space-y-3">
                                {crises.slice(0, 5).map(c => (
                                    <div 
                                        key={c.id} 
                                        className={`p-2 rounded-lg cursor-pointer transition-all border
                                            ${selectedCrisis?.id === c.id ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                                        onClick={() => handleSelectCrisis(c)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/5
                                                ${c.severity >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                LVL {c.severity}
                                            </span>
                                            <span className="text-[9px] text-slate-500">ACTIVE</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{c.title}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CONTROL PANEL (30%) - Fixed Width or Flex-Basis */}
                <aside className="w-[450px] border-l border-white/10 bg-slate-950 flex flex-col overflow-hidden">
                    {showAdmin ? (
                        <div className="p-6 overflow-y-auto">
                            <CrisisAdminPanel 
                                onCrisisCreated={(c) => { 
                                    setCrises([c, ...crises]); 
                                    setSelectedCrisis(c);
                                    setShowAdmin(false); 
                                }}
                                onCrisisUpdated={(c) => {
                                    setCrises(prev => prev.map(p => p.id === c.id ? c : p));
                                    setSelectedCrisis(c);
                                    setShowAdmin(false);
                                }}
                            />
                        </div>
                    ) : selectedCrisis ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Incident Header */}
                            <div className="p-6 bg-gradient-to-b from-red-500/10 to-transparent border-b border-white/10">
                                <div className="flex items-start justify-between mb-4">
                                     <div className={`px-3 py-1 rounded-full text-[10px] font-bold border border-white/10
                                        ${selectedCrisis.severity >= 4 ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                                        SEVERITY {selectedCrisis.severity} / 5
                                     </div>
                                     <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full border border-white/5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase text-slate-300">{selectedCrisis.status}</span>
                                     </div>
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-2 leading-tight">{selectedCrisis.title}</h2>
                                <p className="text-sm text-slate-400 mb-4 line-clamp-3 leading-relaxed">{selectedCrisis.description}</p>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Region</span>
                                        <span className="text-sm font-bold flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-red-500" /> {selectedCrisis.region}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Reporting Org</span>
                                        <span className="text-sm font-bold flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-blue-400" /> Institutional
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Area */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex border-b border-white/10 px-6">
                                     <button className="px-4 py-4 text-xs font-bold border-b-2 border-red-500 text-white flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5" /> SITUATION
                                     </button>
                                     <button className="px-4 py-4 text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                                        <Video className="w-3.5 h-3.5" /> LIVE FEEDS
                                     </button>
                                     <button className="px-4 py-4 text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                                        <History className="w-3.5 h-3.5" /> ANALYSIS
                                     </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                    {/* Timeline Section */}
                                    <section className="mb-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-black tracking-widest uppercase text-slate-300">Operational Timeline</h3>
                                            <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10">REFRESH</button>
                                        </div>
                                        <CrisisTimeline events={selectedCrisis.updates || []} />
                                    </section>

                                    {/* Live Streams Section */}
                                    {selectedCrisis.streams?.length > 0 && (
                                        <section className="mt-8 pt-8 border-t border-white/10">
                                             <h3 className="text-sm font-black tracking-widest uppercase text-slate-300 mb-4 flex items-center gap-2">
                                                <Video className="w-4 h-4 text-red-500" /> Field Reconnaissance
                                             </h3>
                                             <div className="space-y-4">
                                                {selectedCrisis.streams.map(stream => (
                                                    <div key={stream.id} className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative group">
                                                         <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            <button className="bg-red-600 px-4 py-2 rounded-lg font-bold text-sm">ACTIVATE FEED</button>
                                                         </div>
                                                         <img 
                                                            src={`https://img.youtube.com/vi/${new URL(stream.streamUrl).pathname === '/' ? 'dQw4w9WgXcQ' : stream.streamUrl.split('v=')[1] || 'dQw4w9WgXcQ'}/0.jpg`} 
                                                            alt="Stream Preview" 
                                                            className="w-full h-full object-cover opacity-50"
                                                         />
                                                         <div className="absolute top-3 left-3 flex items-center gap-2">
                                                            <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                                                                <span className="w-1 h-1 rounded-full bg-white" /> LIVE
                                                            </span>
                                                            <span className="bg-black/80 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 backdrop-blur">
                                                                {stream.platform}
                                                            </span>
                                                         </div>
                                                    </div>
                                                ))}
                                             </div>
                                        </section>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
                             <div className="bg-white/5 p-6 rounded-full mb-6">
                                <Activity className="w-12 h-12 opacity-20" />
                             </div>
                             <h3 className="font-bold text-white mb-2">Operational Awareness Ready</h3>
                             <p className="text-sm leading-relaxed">Select an active crisis incident from the map or floating feed to begin situational coordination.</p>
                        </div>
                    )}

                    {/* Footer / Status Bar */}
                    <div className="h-10 bg-slate-900 border-t border-white/10 flex items-center justify-between px-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                         <div className="flex items-center gap-4">
                            <span className="text-green-500">COMMS: ENCRYPTED</span>
                            <span>DATA SOURCE: UNIFIED OPS</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span>07:54:21 UTC</span>
                            <ChevronRight className="w-3 h-3" />
                         </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CrisisCommand;
