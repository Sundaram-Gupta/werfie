import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { articlesService } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Edit2, Loader2, Calendar, User, Share2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getMediaUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ComposeModal } from "@/components/feed/compose-modal";

export default function ArticleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            articlesService.getArticle(id).then(res => {
                setArticle(res.data || res);
            }).catch(err => {
                console.error("Failed to fetch article:", err);
                toast.error("Article not found");
                navigate("/explore");
            }).finally(() => setLoading(false));
        }
    }, [id, navigate]);

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!article) return <div className="p-8 text-center text-muted-foreground">Article not found</div>;

    const isOwner = currentUser?.id === article.userId;
    const author = article.user;
    const authorProfile = author?.profile;
    const authorName = authorProfile?.name || author?.name || "User";
    const authorHandle = authorProfile?.handle || author?.handle || "user";

    const shareContent = `Check out this article: ${article.title}\n\n${window.location.origin}/article/${article.id}`;

    return (
        <div className="max-w-3xl mx-auto min-h-screen bg-background border-x border-border/50">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                {isOwner && (
                    <Button variant="outline" size="sm" onClick={() => navigate(`/articles/edit/${id}`)} className="rounded-full">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Article
                    </Button>
                )}
            </div>

            {/* Content */}
            <article className="px-6 py-8">
                {article.coverImage && (
                    <div className="aspect-video rounded-3xl overflow-hidden mb-8 shadow-2xl">
                        <img src={getMediaUrl(article.coverImage)} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight tracking-tight">{article.title}</h1>

                {/* Author Info */}
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-border/50">
                    <Avatar className="w-12 h-12">
                        <AvatarImage src={getMediaUrl(authorProfile?.avatar)} />
                        <AvatarFallback>{authorName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{authorName}</span>
                            <span className="text-muted-foreground">@{authorHandle}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(article.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="article-content text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {article.content}
                </div>
            </article>

            {/* Footer / Call to Action */}
            <div className="px-6 py-12 border-t border-border/50 mt-12 bg-muted/10">
                <p className="text-center text-muted-foreground text-lg mb-4">Enjoyed this article?</p>
                <div className="flex justify-center gap-4">
                    <ComposeModal initialContent={shareContent}>
                        <Button variant="secondary" className="rounded-full font-bold px-8">
                            <Share2 className="w-4 h-4 mr-2" /> Share Article
                        </Button>
                    </ComposeModal>
                    <Button variant="outline" className="rounded-full font-bold px-8" onClick={() => navigate(`/profile/${article.userId}`)}>View Profile</Button>
                </div>
            </div>
        </div>
    );
}
