import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, Reply, AlertTriangle } from 'lucide-react';
import { CommentComposer } from './CommentComposer';
import { cn } from '@/lib/utils';

// Recursive Component
export function CommentThread({ comment, announcementId, depth = 0, onReplySubmitted }) {
    const [isReplying, setIsReplying] = useState(false);
    
    // We limit threading to depth 3 as defined in requirements.
    const maxDepthReached = depth >= 3;

    return (
        <div className={cn(
            "flex flex-col gap-2 pt-4",
            depth > 0 && "ml-4 md:ml-8 border-l border-border/50 pl-4 md:pl-6"
        )}>
            {/* Comment Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Placeholder for User Avatar/Name. In prod, populate from user service mapping */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                        U
                    </div>
                    <div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-sm">Verified Member</span>
                            <BadgeCheck className="w-4 h-4 text-primary fill-current" />
                        </div>
                        <span className="text-xs text-muted-foreground hover:underline cursor-pointer">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
                
                {comment.factFlag && (
                    <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                        <BadgeCheck className="w-3 h-3" />
                        Fact-Checked Contribution
                    </div>
                )}
            </div>

            {/* Comment Body */}
            <div className="text-[15px] leading-relaxed mt-1 text-foreground/90 whitespace-pre-wrap">
                {comment.content}
            </div>

            {/* Actions (No Likes, Viral Metrics) */}
            <div className="flex items-center gap-4 mt-2 mb-2">
                {!maxDepthReached && (
                    <button 
                        onClick={() => setIsReplying(!isReplying)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <Reply className="w-4 h-4" />
                        Reply
                    </button>
                )}
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors ml-auto">
                    <AlertTriangle className="w-3 h-3" />
                    Report
                </button>
            </div>

            {/* Inline Composer for Reply */}
            {isReplying && (
                <div className="mt-2 mb-4">
                    <CommentComposer 
                        announcementId={announcementId}
                        parentCommentId={comment.id}
                        onCancel={() => setIsReplying(false)}
                        onCommentSubmitted={() => {
                            setIsReplying(false);
                            if(onReplySubmitted) onReplySubmitted();
                        }}
                    />
                </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    {comment.replies.map(reply => (
                        <CommentThread 
                            key={reply.id} 
                            comment={reply} 
                            announcementId={announcementId}
                            depth={depth + 1}
                            onReplySubmitted={onReplySubmitted}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
