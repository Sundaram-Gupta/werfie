import React, { useState, useEffect } from 'react';
import { 
    getModerationQueue, 
    approveComment, 
    rejectComment, 
    flagFact 
} from '../services/comment.api';
import { 
    CheckCircle2, 
    XCircle, 
    ShieldCheck, 
    Clock, 
    MessageSquare,
    Search,
    Filter,
    BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function ModerationPanel() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchQueue(activeTab);
    }, [activeTab]);

    const fetchQueue = async (status) => {
        setLoading(true);
        try {
            const data = await getModerationQueue(status);
            setQueue(data);
        } catch (error) {
            toast.error("Failed to load moderation queue");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (queueId) => {
        try {
            await approveComment(queueId, "Approved by moderator verification");
            toast.success("Comment approved");
            fetchQueue(activeTab);
        } catch (error) {
            toast.error("Approval failed");
        }
    };

    const handleReject = async (queueId) => {
        try {
            await rejectComment(queueId, "Rejected: Did not meet credibility standards");
            toast.success("Comment rejected");
            fetchQueue(activeTab);
        } catch (error) {
            toast.error("Rejection failed");
        }
    };

    const handleToggleFact = async (commentId, currentFlag) => {
        try {
            await flagFact(commentId, !currentFlag);
            toast.success(!currentFlag ? "Marked as Fact-Checked" : "Fact-Checked badge removed");
            fetchQueue(activeTab);
        } catch (error) {
            toast.error("Action failed");
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-background mt-2">
            <div className="px-8 py-6 border-b border-border/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                            Content Moderation
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Review and curate institutional discussion for factual integrity.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="pending" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-muted/50 p-1 rounded-full w-fit">
                        <TabsTrigger value="pending" className="rounded-full px-6 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                            <Clock className="w-4 h-4 mr-2" />
                            Pending Queue
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="rounded-full px-6 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Live Comments
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="rounded-full px-6 data-[state=active]:bg-red-500 data-[state=active]:text-white">
                            <XCircle className="w-4 h-4 mr-2" />
                            Archived / Rejected
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-muted-foreground">
                        Synchronizing moderation queue...
                    </div>
                ) : queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-2xl">
                        <MessageSquare className="w-12 h-12 opacity-10 mb-4" />
                        <p className="font-medium text-lg">Queue is empty</p>
                        <p className="text-sm">No items currently require attention in this category.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {queue.map(item => (
                            <div key={item.id} className="bg-muted/10 border border-border/50 rounded-2xl p-6 hover:bg-muted/20 transition-all group">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded">
                                                {item.comment?.announcement?.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Submitted {new Date(item.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-lg leading-relaxed text-foreground/90 mb-4 bg-muted/20 p-4 rounded-xl italic">
                                            "{item.comment?.content}"
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1 font-bold">
                                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                                                Verified Contributor (ID: {item.comment?.userId.split('-')[0]})
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 ml-6 opacity-80 group-hover:opacity-100">
                                        {activeTab === 'pending' && (
                                            <>
                                                <Button 
                                                    onClick={() => handleApprove(item.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button 
                                                    variant="destructive"
                                                    onClick={() => handleReject(item.id)}
                                                    className="font-bold"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </>
                                        ) || activeTab === 'approved' && (
                                            <>
                                                <Button 
                                                    variant={item.comment?.factFlag ? "secondary" : "outline"}
                                                    onClick={() => handleToggleFact(item.commentId, item.comment?.factFlag)}
                                                    className={item.comment?.factFlag ? "bg-green-500/20 text-green-500 border-green-500/30" : "border-border/50"}
                                                >
                                                    <BadgeCheck className="w-4 h-4 mr-2" />
                                                    {item.comment?.factFlag ? "Unmark Fact" : "Mark Fact-Checked"}
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => handleReject(item.id)}
                                                    className="text-red-500 hover:text-red-400 border-border/50"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Re-Moderated (Reject)
                                                </Button>
                                            </>
                                        ) || activeTab === 'rejected' && (
                                            <Button 
                                                variant="outline"
                                                onClick={() => handleApprove(item.id)}
                                                className="border-green-500/50 text-green-500 font-bold"
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Restore / Approve
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
