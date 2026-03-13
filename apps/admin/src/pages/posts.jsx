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

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await contentService.getPosts(filter === 'reported' ? 'reported' : 'all');
            setPosts(Array.isArray(data) ? data : data?.data ?? []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [filter]);

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

            <Tabs defaultValue="all" onValueChange={setFilter}>
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
