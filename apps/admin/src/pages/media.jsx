import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileVideo, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import * as contentService from '@/services/contentService';

export default function MediaModerationPage() {
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        setLoading(true);
        try {
            const data = await contentService.getMedia();
            // Mock if empty for demo
            if (!data.items || data.items.length === 0) {
                 setMediaItems([
                    { id: 1, type: "image", url: "https://source.unsplash.com/random/400x300", flagged: true, reason: "NSFW", uploader: "user1" },
                    { id: 2, type: "video", url: "https://example.com/video.mp4", flagged: false, reason: null, uploader: "user2" },
                    { id: 3, type: "image", url: "https://source.unsplash.com/random/401x301", flagged: false, reason: null, uploader: "user3" },
                    { id: 4, type: "image", url: "https://source.unsplash.com/random/402x302", flagged: true, reason: "Gore", uploader: "user4" },
                ]);
            } else {
                setMediaItems(data.items);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (action === "delete") {
            try {
                await contentService.deleteMedia(id);
                setMediaItems(mediaItems.filter(m => m.id !== id));
            } catch (error) {
                // Determine if we should fail or just optimistic update for mock
                setMediaItems(mediaItems.filter(m => m.id !== id)); 
            }
        } else if (action === "approve") {
            // Logic to unflag or verify media
             setMediaItems(mediaItems.map(m => m.id === id ? { ...m, flagged: false } : m));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white/90">Media Moderation</h1>
                    <p className="text-gray-400">Review and manage uploaded images and videos.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaItems.map((item) => (
                    <Card key={item.id} className="bg-[#151516] border-white/5 overflow-hidden group">
                        <div className="relative aspect-square bg-gray-900">
                             {item.type === 'image' ? (
                                <img src={item.url} alt="Media" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-500">
                                    <FileVideo className="h-12 w-12" />
                                </div>
                            )}
                            
                            {item.flagged && (
                                <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600/90 text-white text-xs px-2 py-1 rounded shadow-md backdrop-blur-sm">
                                    <ShieldAlert className="h-3 w-3" /> {item.reason}
                                </div>
                            )}
                        </div>

                        <CardContent className="p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-400 truncate">@{item.uploader}</span>
                                <span className="text-xs text-gray-600 uppercase font-bold tracking-wide">{item.type}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 h-8 text-xs font-semibold" 
                                    onClick={() => handleAction(item.id, "delete")}
                                >
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                                <Button 
                                    className="flex-1 bg-green-600/10 hover:bg-green-600/20 text-green-500 h-8 text-xs font-semibold"
                                    onClick={() => handleAction(item.id, "approve")}
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" /> OK
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
