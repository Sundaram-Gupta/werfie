import { useState, useEffect, useCallback } from 'react';
import * as contentService from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EyeOff, Trash2, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Search, Image as ImageIcon } from 'lucide-react';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Admin posts page size: show 100 posts per page
const PAGE_SIZE = 100;

/** Format large numbers as 103.5K, 1.2M, etc. */
function formatCount(n) {
    if (n == null || Number.isNaN(n)) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
}

export default function PostsPage() {
    const [posts, setPosts] = useState([]);
    const [totalPosts, setTotalPosts] = useState(null);
    const [totalCountUncapped, setTotalCountUncapped] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [hasMedia, setHasMedia] = useState(false);
    const [viewMode, setViewMode] = useState('paged'); // 'paged' | 'all'
    const [hasMore, setHasMore] = useState(false);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await contentService.getPosts(
                filter === 'reported' ? 'reported' : 'all', 
                currentPage, 
                PAGE_SIZE,
                search,
                hasMedia
            );
            const list = data?.posts ?? (Array.isArray(data) ? data : data?.data ?? []);
            const pag = data?.pagination;
            const total = pag?.totalPosts ?? list.length;
            const pages = pag?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
            setTotalPosts(total);
            setTotalPages(pages);
            const hasServerPagination = pag?.totalPages != null;
            const postsToShow = hasServerPagination ? list : list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
            setPosts(postsToShow);
            setHasMore(hasServerPagination ? (currentPage < pages) : (postsToShow.length >= PAGE_SIZE));
        } catch (error) {
            console.error(error);
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [filter, currentPage]);

    const loadAllPosts = useCallback(async () => {
        setLoading(true);
        setViewMode('all');
        try {
            const all = [];
            let page = 1;
            // Hard safety cap to avoid infinite loops if backend misbehaves
            const MAX_PAGES = 2000;
            while (page <= MAX_PAGES) {
                const data = await contentService.getPosts(
                    filter === 'reported' ? 'reported' : 'all', 
                    page, 
                    PAGE_SIZE,
                    search,
                    hasMedia
                );
                const list = data?.posts ?? (Array.isArray(data) ? data : data?.data ?? []);
                if (!Array.isArray(list) || list.length === 0) break;
                all.push(...list);
                if (list.length < PAGE_SIZE) break;
                page += 1;
            }
            setPosts(all);
            setCurrentPage(1);
            setHasMore(false);
            // Prefer uncapped count if available; otherwise fall back to fetched length
            setTotalPosts((filter === 'all' ? (totalCountUncapped || all.length) : all.length));
            setTotalPages(1);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load all posts');
        } finally {
            setLoading(false);
        }
    }, [filter, totalCountUncapped]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (viewMode === 'all') {
                loadAllPosts();
            } else {
                fetchPosts();
            }
        }, search ? 500 : 0);
        return () => clearTimeout(timer);
    }, [fetchPosts, loadAllPosts, viewMode, search, hasMedia]);

    useEffect(() => {
        contentService.getPostsCount().then(setTotalCountUncapped).catch(() => {});
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        setViewMode('paged');
    }, [filter]);

    useRefreshOnFocus(fetchPosts);
    useRefreshOnFocus(() => contentService.getPostsCount().then(setTotalCountUncapped).catch(() => {}));

    const handleAction = async (postId, action) => {
        try {
            if (action === 'delete') {
                await contentService.deletePost(postId);
                await fetchPosts();
                contentService.getPostsCount().then(setTotalCountUncapped).catch(() => {});
                toast.success('Post deleted');
            } else if (action === 'hide') {
                await contentService.hidePost(postId);
                await fetchPosts();
                contentService.getPostsCount().then(setTotalCountUncapped).catch(() => {});
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
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Post Moderation</h1>
                    {(totalCountUncapped != null || totalPosts != null) && (
                        <p className="text-muted-foreground mt-1">
                            Total posts: <span className="font-semibold text-foreground">
                                {formatCount(filter === 'all'
                                    ? (totalCountUncapped > 0 ? totalCountUncapped : (totalPosts ?? totalCountUncapped ?? 0))
                                    : (totalPosts ?? 0))}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {viewMode === 'all'
                            ? `Showing all`
                            : `Page ${currentPage} of ${totalPages}`}
                        {(filter === 'all'
                            ? (totalCountUncapped > 0 ? totalCountUncapped : totalPosts) != null
                            : totalPosts != null) && ` • ${formatCount(filter === 'all' ? (totalCountUncapped > 0 ? totalCountUncapped : totalPosts) : totalPosts)} total`}
                    </span>
                    <Button variant="outline" size="sm" onClick={fetchPosts} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant={viewMode === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={viewMode === 'all' ? () => setViewMode('paged') : loadAllPosts}
                        disabled={loading}
                        title="Load all posts from DB (may take time)"
                    >
                        {viewMode === 'all' ? 'Paged view' : 'Load all'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search post content..."
                        className="pl-9 h-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center space-x-2 bg-background/50 px-3 py-2 rounded-md border border-border/50 h-10">
                    <Checkbox 
                        id="hasMedia" 
                        checked={hasMedia} 
                        onCheckedChange={setHasMedia}
                    />
                    <Label htmlFor="hasMedia" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 pr-1">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Has Media
                    </Label>
                </div>
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
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

            {viewMode !== 'all' && (totalPages > 1 || (totalPosts != null && totalPosts > 0)) && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-muted-foreground">
                        {totalPosts > 0
                            ? `Showing ${((currentPage - 1) * PAGE_SIZE) + 1}–${Math.min(currentPage * PAGE_SIZE, totalPosts)} of ${formatCount(totalPosts)} posts`
                            : '0 posts'}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {(() => {
                                const maxButtons = 5;
                                let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
                                let end = Math.min(totalPages, start + maxButtons - 1);
                                if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
                                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? 'default' : 'outline'}
                                        size="sm"
                                        className="w-9 h-9 p-0"
                                        onClick={() => setCurrentPage(page)}
                                        disabled={loading}
                                    >
                                        {page}
                                    </Button>
                                ));
                            })()}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={(!hasMore && currentPage >= totalPages) || loading}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
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
