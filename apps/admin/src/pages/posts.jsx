import { useState, useEffect } from 'react';
import * as contentService from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, EyeOff, Trash2, CheckCircle } from 'lucide-react';

export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const data = await contentService.getPosts(filter === 'reported' ? 'reported' : 'all');
                setPosts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [filter]);

    const handleAction = async (postId, action) => {
        // Optimistic UI update could go here
        alert(`${action} action on post ${postId} (Mock)`);
        if (action === 'delete') {
            await contentService.deletePost(postId);
            setPosts(posts.filter(p => p.id !== postId));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Post Moderation</h1>
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
