import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Globe, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { StructuredComments } from '../components/comments/StructuredComments';
import { Button } from '@/components/ui/button';
import { getApiBase } from '@/lib/api';

export default function AnnouncementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                // Assuming there's a route for getting a single announcement. Let's hit the general API.
                // If it doesn't exist, we added `router.get('/:id')` to announcementRoutes.js previously?
                // Let's assume it exists at `/api/announcements/:id`
                const response = await axios.get(`${getApiBase()}/api/announcements/${id}`);
                setAnnouncement(response.data);
            } catch (error) {
                console.error("Failed to load announcement:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncement();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading specific announcement...</div>;
    }

    if (!announcement) {
        return <div className="p-8 text-center text-red-500">Announcement not found or deleted.</div>;
    }

    return (
        <div className="w-full h-full flex flex-col no-scrollbar">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-6">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 hover:bg-muted/50 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-xl font-bold leading-none">Official Record</h2>
                    <span className="text-xs text-muted-foreground">ID: {announcement.id.split('-')[0]}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto px-4 py-6">
                {/* Announcement Core View */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary" />
                        <span className="font-bold">{announcement.category || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground border border-border/50 px-2 py-0.5 rounded-full">
                        <Globe className="w-3.5 h-3.5" />
                        {Array.isArray(announcement.regions) ? announcement.regions.join(', ') : 'Global'}
                    </div>
                </div>

                <h1 className="text-3xl font-black mb-4">{announcement.title}</h1>
                
                <div className="text-sm font-semibold text-muted-foreground mb-6">
                    Published: {new Date(announcement.effectiveDate).toLocaleString()}
                </div>

                <div className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap mb-8">
                    {announcement.content}
                </div>

                {announcement.aiSummary && (
                    <div className="mb-8 p-4 rounded-xl bg-muted/30 border border-border/20 border-dashed space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase">
                            <CheckCircle2 className="w-4 h-4" />
                            AI Executive Summary
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap italic">
                            {announcement.aiSummary}
                        </p>
                    </div>
                )}

                {/* Structured Comments Integration */}
                <StructuredComments announcement={announcement} />
            </div>
        </div>
    );
}
