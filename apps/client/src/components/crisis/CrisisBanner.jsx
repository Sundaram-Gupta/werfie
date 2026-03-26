import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronRight, ShieldAlert, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getCrises } from '@/services/crisis.api';
import { createSocketWithRecovery } from '@/lib/socketWithRecovery';
import { getGatewayUrl } from '@/lib/api';

const CrisisBanner = () => {
    const [criticalCrises, setCriticalCrises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const fetchCritical = async () => {
            try {
                const data = await getCrises({ severity: 4, status: 'active' });
                setCriticalCrises(data);
            } catch (error) {
                console.error('Failed to fetch critical crises');
            }
        };
        fetchCritical();

        // Socket for real-time alerts
        const token = localStorage.getItem('accessToken');
        const crisisSocket = createSocketWithRecovery(`${getGatewayUrl()}/crisis-live`, {
            auth: { token }
        });

        crisisSocket.on('crisis.alert', (newCrisis) => {
            setCriticalCrises(prev => [newCrisis, ...prev.filter(c => c.id !== newCrisis.id)]);
            setVisible(true);
        });

        crisisSocket.on('crisis.resolved', (resolved) => {
            setCriticalCrises(prev => prev.filter(c => c.id !== resolved.id));
        });

        return () => crisisSocket.disconnect();
    }, []);

    // Rotate messages if multiple
    useEffect(() => {
        if (criticalCrises.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % criticalCrises.length);
            }, 8000);
            return () => clearInterval(timer);
        }
    }, [criticalCrises.length]);

    // Don't show banner on the command page itself
    if (location.pathname === '/crisis-command' || !visible || criticalCrises.length === 0) {
        return null;
    }

    const currentCrisis = criticalCrises[currentIndex];

    return (
        <div className="bg-red-600/95 backdrop-blur-md text-white px-4 py-2 flex items-center justify-between sticky top-0 z-[1001] shadow-xl border-b border-red-400/20 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 bg-white/20 p-1.5 rounded-full animate-pulse">
                    <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block leading-none mb-0.5">
                        Operational Alert Level {currentCrisis.severity}
                    </span>
                    <p className="text-xs font-bold truncate">
                        {currentCrisis.title}: {currentCrisis.description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                <Link 
                    to="/crisis-command" 
                    className="flex items-center gap-1.5 bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight transition-all"
                >
                    ENTER COMMAND VIEW <ChevronRight className="w-3 h-3" />
                </Link>
                <button onClick={() => setVisible(false)} className="text-white/60 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress bar for rotation */}
            {criticalCrises.length > 1 && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-white/30 w-full">
                    <div 
                        key={currentIndex}
                        className="h-full bg-white transition-all duration-[8000ms] ease-linear"
                        style={{ width: '100%' }}
                    />
                </div>
            )}
        </div>
    );
};

export default CrisisBanner;
