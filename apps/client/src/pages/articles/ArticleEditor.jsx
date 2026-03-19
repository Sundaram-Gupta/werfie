import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { articlesService, mediaService } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Image as ImageIcon, Loader2, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ArticleEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (id) {
            articlesService.getArticle(id).then(res => {
                const article = res.data || res;
                setTitle(article.title);
                setContent(article.content);
                setCoverImage(article.coverImage || "");
                setIsPublished(article.isPublished);
            }).catch(err => {
                console.error("Failed to fetch article:", err);
                toast.error("Failed to load article for editing");
            }).finally(() => setFetching(false));
        }
    }, [id]);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        setUploading(true);
        try {
            const result = await mediaService.uploadMedia(file);
            setCoverImage(result.url);
            toast.success("Image uploaded");
        } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (isPublished = false) => {
        if (!title.trim() || !content.trim()) {
            toast.error("Title and content are required");
            return;
        }
        setLoading(true);
        try {
            const data = { title, content, coverImage, isPublished };
            if (id) {
                await articlesService.updateArticle(id, data);
                toast.success("Article updated");
            } else {
                await articlesService.createArticle(data);
                toast.success("Article created");
            }
            navigate(-1);
        } catch (err) {
            console.error("Failed to save article:", err);
            toast.error("Failed to save article");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col justify-center items-center h-screen space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading your story...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto min-h-screen bg-background relative pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-md z-30 border-b border-border/50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)} 
                            className="rounded-full hover:bg-muted/80 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <span className="text-sm font-medium text-muted-foreground">
                            {id ? "Editing story" : "Draft"}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => handleSave(false)} 
                            disabled={loading || uploading} 
                            className="rounded-full font-medium hover:bg-muted/80"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>
                        <Button 
                            onClick={() => handleSave(true)} 
                            disabled={loading || uploading} 
                            className="rounded-full font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm px-6"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            {isPublished ? "Update" : "Publish"}
                        </Button>
                    </div>
                </div>
            </div>
            
            <div className="px-6 mt-8 space-y-8">
                {/* Cover Image Section */}
                <div className="relative w-full">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    
                    {coverImage ? (
                        <div className="relative group w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-primary/5">
                            <img 
                                src={coverImage} 
                                alt="Cover" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <Button 
                                    variant="secondary" 
                                    className="rounded-full font-bold backdrop-blur-sm bg-white/20 text-white hover:bg-white/30 border-white/20"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    Change Image
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="icon"
                                    className="rounded-full shadow-lg"
                                    onClick={() => setCoverImage("")}
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                    <p className="text-sm font-medium animate-pulse">Uploading new cover...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div 
                            className={cn(
                                "group relative w-full aspect-[21/9] rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer",
                                uploading ? "bg-muted/20 border-primary" : "border-border/50 hover:border-primary/50 hover:bg-muted/10 bg-muted/5"
                            )}
                            onClick={() => !uploading && fileInputRef.current.click()}
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center space-y-3">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <span className="text-sm font-semibold text-primary animate-pulse">Uploading cover...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-background shadow-sm border border-border/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-lg font-bold text-foreground">Add a cover image</span>
                                        <span className="text-sm text-muted-foreground">High-quality images get more reads</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Title Section */}
                <div className="max-w-3xl mx-auto w-full group/editor-focus">
                    <textarea 
                        placeholder="Title" 
                        value={title} 
                        onChange={e => {
                            setTitle(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onFocus={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                        className="w-full text-5xl font-black bg-transparent border-none outline-none focus:ring-0 resize-none placeholder:text-muted-foreground/20 leading-[1.1] tracking-tighter overflow-hidden py-2"
                        style={{ height: 'auto' }}
                    />
                    
                    {/* Premium Divider */}
                    <div className="relative h-1 w-full my-8">
                        <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-primary to-primary/20 rounded-full transition-all duration-700 group-focus-within/editor-focus:w-48" />
                        <div className="absolute left-0 top-0 h-[1px] w-full bg-border/20 mt-0.5" />
                    </div>
                    
                    <Textarea 
                        placeholder="Tell your story..." 
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        className="min-h-[600px] text-xl leading-relaxed border-none focus-visible:ring-0 bg-transparent p-0 resize-none placeholder:text-muted-foreground/30 selection:bg-primary/20"
                    />
                </div>
            </div>
        </div>
    );
}
