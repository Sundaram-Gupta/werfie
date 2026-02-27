import React from 'react';
import { Clock, AlertTriangle, Info, Volume2, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CrisisTimeline = ({ events = [] }) => {
    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Clock className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm italic">Establishing timeline...</p>
            </div>
        );
    }

    // Combine updates, announcements, etc. if not already done in service
    // For now assuming events are pre-formatted/sorted

    return (
        <div className="space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:w-[1px] before:bg-white/10">
            {events.map((event, idx) => (
                <div key={event.id || idx} className="relative pl-8 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center z-10 
                        ${event.announcementId ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'} 
                        border border-white/10`}>
                        {event.announcementId ? <Volume2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                {event.announcementId ? 'Official Announcement' : 'Situation Update'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                                {formatDistanceToNow(new Date(event.timestamp || event.createdAt), { addSuffix: true })}
                            </span>
                        </div>
                        
                        <p className="text-sm text-slate-200 leading-relaxed">
                            {event.updateText || event.content}
                        </p>

                        {event.announcementId && (
                            <button className="mt-2 text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                                <Info className="w-3 h-3" /> View Source Announcement
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CrisisTimeline;
