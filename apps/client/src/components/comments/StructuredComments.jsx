import React, { useState, useEffect } from 'react';
import { getComments } from '../../services/comment.api';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';
import { Info, Lock } from 'lucide-react';

export function StructuredComments({ announcement }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [unlocksAt, setUnlocksAt] = useState(null);

    // Fetch and calculate lock state
    useEffect(() => {
        if (!announcement) return;

        // Info-Lock Calculation
        const effective = new Date(announcement.effectiveDate);
        const durationMs = (announcement.lockDurationMinutes || 0) * 60 * 1000;
        const expiry = new Date(effective.getTime() + durationMs);
        const now = new Date();

        if (now < expiry) {
            setIsLocked(true);
            setUnlocksAt(expiry);
        } else {
            setIsLocked(false);
        }

        fetchComments();
    }, [announcement]);

    const fetchComments = async () => {
        if (!announcement) return;
        setLoading(true);
        try {
            const data = await getComments(announcement.id);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments", error);
        } finally {
            setLoading(false);
        }
    };

    if (!announcement) return null;

    return (
        <div className="mt-8 border-t border-border/50 pt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Structured Assessment</h3>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-muted/50 text-muted-foreground uppercase flex items-center gap-1">
                    <Info className="w-3 h-3" /> Strictly Moderated
                </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
                Institutional dialogue must adhere to factual guidelines. Contributions from verified members are pre-moderated. 
                Viral metrics (likes/shares) are disabled to ensure neutral discourse.
            </p>

            {/* Info Lock Warning */}
            {isLocked ? (
                <div className="p-4 border border-amber-500/50 bg-amber-500/10 rounded-lg flex items-start gap-3 mb-6">
                    <Lock className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-500 text-sm">Information Review Lock Active</h4>
                        <p className="text-xs text-amber-500/80 mt-1">
                            To prevent hasty reactions, comments on this announcement are disabled until the initial reading period expires.
                            <br />
                            <strong>Unlocks at:</strong> {unlocksAt?.toLocaleString()}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mb-8">
                    <CommentComposer 
                        announcementId={announcement.id} 
                        onCommentSubmitted={fetchComments}
                    />
                </div>
            )}

            {/* Thread Generation */}
            <div className="space-y-6">
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">Loading verified perspectives...</div>
                ) : comments.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg">
                        No verified perspectives have been approved yet.
                    </div>
                ) : (
                    comments.map(threadRoot => (
                        <div key={threadRoot.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                            <CommentThread 
                                comment={threadRoot} 
                                announcementId={announcement.id} 
                                onReplySubmitted={fetchComments}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
