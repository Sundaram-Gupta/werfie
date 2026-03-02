import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Send } from 'lucide-react';
import { createComment } from '../../services/comment.api';
import { toast } from 'sonner';

export function CommentComposer({ announcementId, parentCommentId = null, onCommentSubmitted, onCancel }) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const MAX_CHARS = 500;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await createComment(announcementId, content, parentCommentId);
            toast.success("Comment submitted for moderation. It will be visible once approved.");
            setContent('');
            if (onCommentSubmitted) onCommentSubmitted();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to submit comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 border border-border/50 rounded-lg p-4 bg-muted/10 relative">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>Verified Contribution</span>
            </div>
            
            <textarea
                className="w-full bg-transparent border-none resize-none focus:outline-none text-[15px] placeholder:text-muted-foreground min-h-[80px]"
                placeholder={parentCommentId ? "Draft your reply (strictly moderated)..." : "Draft your institutional perspective (strictly moderated)..."}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                disabled={isSubmitting}
            />

            <div className="flex justify-between items-center mt-2 border-t border-border/50 pt-3">
                <span className={`text-xs ${content.length > MAX_CHARS - 50 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {content.length} / {MAX_CHARS}
                </span>

                <div className="flex gap-2">
                    {onCancel && (
                        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button 
                        type="submit" 
                        size="sm" 
                        disabled={isSubmitting || !content.trim()}
                        className="rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                    >
                        {isSubmitting ? "Submitting..." : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Submit for Review
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
