import { useState, useEffect, useCallback } from 'react';
import * as contentService from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EyeOff, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { toast } from 'sonner';

export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const limit = 9; // Grid layout looks better with multiples of 3

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await contentService.getPosts(page, limit, filter);
            if (Array.isArray(data)) {
                 setPosts(data);
                 setTotalPages(1);
            } else {
                 setPosts(data?.posts || []);
                 setTotalPages(data?.pagination?.totalPages || 1);
                 setTotalPosts(data?.pagination?.totalPosts || 0);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useRefreshOnFocus(fetchPosts);

    const handleAction = async (postId, action) => {
        try {
            if (action === 'delete') {
                await contentService.deletePost(postId);
                await fetchPosts();
                toast.success('Post deleted');
            } else if (action === 'hide') {
                await contentService.hidePost(postId);
                await fetchPosts();
                toast.success('Post hidden');
            } else if (action === 'dismiss') {
                await fetchPosts();
                toast.success('Reports dismissed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Post Moderation</h1>
                <Button variant="outline" size="sm" onClick={fetchPosts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="all" onValueChange={(v) => { setFilter(v); setPage(1); }}>
                <TabsList>
                    <TabsTrigger value="all">All Posts</TabsTrigger>
                    <TabsTrigger value="reported">Reported Only</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 pt-4">
                    {loading ? <div>Loading...</div> : <PostsGrid posts={posts} onAction={handleAction} />}
                </TabsContent>
                <TabsContent value="reported" className="space-y-4 pt-4">
                    {loading ? <div>Loading...</div> : <PostsGrid posts={posts} onAction={handleAction} />}
                </TabsContent>
            </Tabs>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-8 p-4 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-bold">
                                {i}
                            </div>
                        ))}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                        {totalPosts} posts found • Page {page} of {totalPages}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page <= 1 || loading}
                        className="h-9"
                    >
                        Previous
                    </Button>
                    <div className="px-4 py-1.5 border border-border rounded-lg bg-muted/30 font-bold text-sm">
                        {page}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                        className="h-9"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function PostsGrid({ posts, onAction }) {
    if (posts.length === 0) return <div>No posts found.</div>;

    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
                <Card key={post.id} className="flex flex-col">
                    <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                        <Avatar>
                            <AvatarFallback>{post.user.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{post.user}</span>
                            <span className="text-xs text-muted-foreground">{post.handle}</span>
                        </div>
                        {post.reportCount > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                                {post.reportCount} Reports
                            </Badge>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 flex-1">
                        <p className="text-sm">{post.content}</p>
                        {post.image && (
                            <img
                                src={post.image}
                                alt="Post content"
                                className="mt-3 rounded-md w-full h-40 object-cover bg-muted"
                            />
                        )}
                        <div className="mt-3 text-xs text-muted-foreground">
                            Posted on {post.date}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t bg-muted/50 flex justify-between">
                        <Button variant="ghost" size="sm" onClick={() => onAction(post.id, 'dismiss')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Keep
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onAction(post.id, 'hide')}>
                            <EyeOff className="mr-2 h-4 w-4" /> Hide
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => onAction(post.id, 'delete')}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
