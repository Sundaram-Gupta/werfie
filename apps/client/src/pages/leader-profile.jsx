import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BadgeCheck, Globe, TrendingUp, Radio } from 'lucide-react';
import { AnnouncementFeedCard } from '../components/feed/announcement-feed-card';
import { getApiBase } from '@/lib/api';

export default function LeaderProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [leader, setLeader] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderData = async () => {
            try {
                // Fetch Leader details from User Service
                const base = getApiBase();
                const leaderRes = await axios.get(`${base}/api/users/leaders/${id}`);
                setLeader(leaderRes.data);

                // Fetch Leader Posts from Content Service
                const postsRes = await axios.get(`${base}/api/feed/leaders/${id}/posts`);
                setPosts(postsRes.data);
            } catch (error) {
                console.error("Failed to fetch leader profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchLeaderData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex-1 w-[600px] min-h-screen border-x border-border/50 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!leader) {
        return (
            <div className="flex-1 w-[600px] min-h-screen border-x border-border/50 p-8 text-center text-muted-foreground">
                Leader not found.
            </div>
        );
    }

    if (!leader.verifiedStatus) {
        return (
            <div className="flex-1 w-[600px] min-h-screen border-x border-border/50 bg-background pb-20 sm:pb-0">
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold">World Leader</h1>
                        <p className="text-xs text-muted-foreground">Approval pending</p>
                    </div>
                </header>
                <div className="p-8 text-center text-muted-foreground">
                    This institutional request has not been approved yet, so official posts are not available.
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-[600px] min-h-screen border-x border-border/50 bg-background pb-20 sm:pb-0">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-1">
                        {leader.leaderName}
                        {leader.verifiedStatus && <BadgeCheck className="w-5 h-5 text-blue-500" />}
                    </h1>
                    <p className="text-xs text-muted-foreground">{posts.length} Official Posts</p>
                </div>
            </header>

            {/* Banner & Profile Info */}
            <div className="relative border-b border-border/50 pb-4">
                <div className="h-32 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 w-full" />
                
                <div className="px-4 relative -mt-12">
                    <div className="flex justify-between items-end">
                        <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
                            {leader.profileImage ? (
                                <img src={leader.profileImage} alt={leader.leaderName} className="w-full h-full object-cover" />
                            ) : (
                                <Globe className="w-12 h-12 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <h2 className="text-2xl font-bold flex items-center gap-1">
                            {leader.leaderName}
                            {leader.verifiedStatus && <BadgeCheck className="w-6 h-6 text-blue-500" />}
                        </h2>
                        <p className="text-muted-foreground">{leader.title}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" /> {leader.country} ({leader.region})
                            </span>
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" /> Priority Rank: {leader.priorityRank}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col">
                <div className="px-4 py-3 border-b border-border/50 bg-muted/20 font-semibold">
                    Official Feed
                </div>
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No official posts found.
                    </div>
                ) : (
                    posts.map((post) => (
                        <div key={post.id} className="relative border-b border-border/50 p-4 hover:bg-muted/30 transition">
                            
                            {/* Live Badge Overlay */}
                            {post.isLive && (
                                <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-500/10 text-red-500 px-2 py-1 rounded-full text-xs font-bold animate-pulse z-10">
                                    <Radio className="w-3 h-3" />
                                    LIVE
                                </div>
                            )}

                            <AnnouncementFeedCard announcement={post} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
