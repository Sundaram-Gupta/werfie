import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { articlesService } from "@/services/api";
import { getMediaUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function ArticlePreviewCard({ articleId }) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (articleId) {
            articlesService.getArticle(articleId)
                .then(res => setArticle(res.data || res))
                .catch(err => console.error("Failed to fetch article preview:", err))
                .finally(() => setLoading(false));
        }
    }, [articleId]);

    if (loading) return (
        <div className="mt-3 p-4 rounded-2xl border border-border bg-muted/5 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
    );

    if (!article) return null;

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/article/${article.id}`);
    };

    return (
        <div 
            className="mt-3 rounded-2xl border border-border overflow-hidden bg-background hover:bg-muted/10 transition-colors cursor-pointer group"
            onClick={handleClick}
        >
            {article.coverImage && (
                <div className="aspect-[21/9] w-full overflow-hidden border-b border-border">
                    <img 
                        src={getMediaUrl(article.coverImage)} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Article</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground truncate">
                        {article.user?.profile?.name || article.user?.name || "User"}
                    </span>
                </div>
                <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {article.content.substring(0, 150).replace(/[#*]/g, '')}...
                </p>
            </div>
        </div>
    );
}
