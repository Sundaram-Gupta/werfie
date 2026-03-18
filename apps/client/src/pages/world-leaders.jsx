import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Globe, BadgeCheck, Radio, AlertTriangle } from 'lucide-react';
import { AnnouncementFeedCard } from '../components/feed/announcement-feed-card';
import { getApiBase, getGatewayUrl } from '@/lib/api';

export default function WorldLeadersPage() {
    const [feed, setFeed] = useState([]);
    const [featuredLeaders, setFeaturedLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [regionFilter, setRegionFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Feed with filters
                const queryParams = new URLSearchParams();
                if (regionFilter) queryParams.append('region', regionFilter);
                if (severityFilter) queryParams.append('severity', severityFilter);
                
                const base = getApiBase();
                const feedRes = await axios.get(`${base}/api/feed/world-leaders?${queryParams.toString()}`);
                const feedPayload = feedRes.data?.data ?? feedRes.data;
                setFeed(Array.isArray(feedPayload) ? feedPayload : []);

                // Fetch Featured Leaders (top 10 by priority)
                const leadersRes = await axios.get(`${base}/api/users/leaders?limit=10`);
                const payload = leadersRes.data?.data ?? leadersRes.data;
                if (Array.isArray(payload)) {
                    setFeaturedLeaders(payload);
                } else if (payload && Array.isArray(payload.leaders)) {
                    setFeaturedLeaders(payload.leaders);
                }
            } catch (error) {
                console.error("Failed to fetch world leaders data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Setup WebSocket connection
        const socket = io(getGatewayUrl(), { path: '/ws/live' });

        socket.on('connect', () => {
            console.log('Connected to World Leaders Live Updates');
        });

        socket.on('new_leader_post', (post) => {
            setFeed(prev => [post, ...prev].sort((a,b) => b.leaderPriorityScore - a.leaderPriorityScore));
        });

        socket.on('leader_live', (post) => {
            setFeed(prev => {
                const existing = prev.find(p => p.id === post.id);
                if (existing) {
                    return prev.map(p => p.id === post.id ? { ...p, isLive: true } : p);
                }
                return [post, ...prev];
            });
        });

        return () => socket.disconnect();
    }, [regionFilter, severityFilter]); // Re-fetch on filter change

    return (
        <div className="flex-1 w-[600px] min-h-screen border-x border-border/50 bg-background pb-20 sm:pb-0">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Globe className="w-6 h-6 text-blue-500" />
                    <h1 className="text-xl font-bold">World Leaders</h1>
                </div>
            </header>

            {/* Filters Section */}
            <div className="bg-background border-b border-border/50 px-4 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Filter by:</span>
                    <select 
                        value={regionFilter} 
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="bg-muted text-sm rounded-md px-3 py-1.5 border-none focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="">All Regions</option>
                        <option value="North America">North America</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia">Asia</option>
                        <option value="Middle East">Middle East</option>
                        <option value="Africa">Africa</option>
                        <option value="South America">South America</option>
                    </select>
                    
                    <select 
                        value={severityFilter} 
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-muted text-sm rounded-md px-3 py-1.5 border-none focus:ring-1 focus:ring-primary outline-none"
                    >
                        <option value="">Any Severity</option>
                        <option value="3">Severity 3+</option>
                        <option value="4">Severity 4+</option>
                        <option value="5">Severity 5</option>
                    </select>
                </div>
            </div>

            {/* Featured Leaders Section */}
            {featuredLeaders.length > 0 && (
                <div className="border-b border-border/50 p-4">
                    <h2 className="text-sm font-bold text-muted-foreground mb-3 tracking-wider uppercase">Featured Leaders</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {featuredLeaders.map(leader => (
                            <div key={leader.id} className="flex flex-col items-center gap-2 min-w-[80px] shrink-0 cursor-pointer hover:opacity-80 transition">
                                <div className="relative">
                                    <img 
                                        src={leader.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.leaderName)}&background=random`} 
                                        alt={leader.leaderName} 
                                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                                    />
                                    {leader.verifiedStatus && (
                                        <BadgeCheck className="w-5 h-5 text-blue-500 absolute -bottom-1 -right-1 bg-background rounded-full border border-background" />
                                    )}
                                </div>
                                <span className="text-xs font-medium text-center line-clamp-1">{leader.leaderName}</span>
                                <span className="text-[10px] text-muted-foreground text-center line-clamp-1">{leader.country}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feed Section */}
            <div className="flex flex-col">
                {loading ? (
                    <div className="p-4 flex justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : feed.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No official world leader communications found.
                    </div>
                ) : (
                    feed.map((post) => (
                        <div key={post.id} className="relative border-b border-border/50 p-4 hover:bg-muted/30 transition">
                            
                            {/* Live Badge Overlay */}
                            {post.isLive && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-500/10 text-red-500 px-2 flex py-1 rounded-full text-xs font-bold animate-pulse">
                                    <Radio className="w-3 h-3" />
                                    LIVE
                                </div>
                            )}

                            {/* World Leader Header Context */}
                            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold text-foreground">World Leader Communication</span>
                                <span>•</span>
                                <span>Priority {post.leaderPriorityScore}</span>
                            </div>

                            {/* Reuse Announcement Card */}
                            <AnnouncementFeedCard announcement={post} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
