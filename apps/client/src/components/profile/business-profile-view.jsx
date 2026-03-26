import { useState, useEffect } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star, ShoppingBag, Loader2 } from "lucide-react"
import { businessService } from "@/services/api"
import { cn, getMediaUrl } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

export function BusinessProfileView({ profile, currentUser }) {
    const { t } = useTranslation()
    const [products, setProducts] = useState([])
    const [reviews, setReviews] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" })
    const [submittingReview, setSubmittingReview] = useState(false)

    const businessId = profile.businessProfile?.id

    useEffect(() => {
        if (businessId) {
            fetchProducts()
            fetchReviews()
        }
    }, [businessId])

    const fetchProducts = async () => {
        setLoadingProducts(true)
        try {
            const data = await businessService.getProducts(businessId)
            setProducts(data || [])
        } catch (err) {
            console.error("Failed to fetch products:", err)
        } finally {
            setLoadingProducts(false)
        }
    }

    const fetchReviews = async () => {
        setLoadingReviews(true)
        try {
            const data = await businessService.getReviews(businessId)
            setReviews(data || [])
        } catch (err) {
            console.error("Failed to fetch reviews:", err)
        } finally {
            setLoadingReviews(false)
        }
    }

    const handleAddReview = async () => {
        if (!newReview.comment.trim()) {
            toast.error("Please add a comment")
            return
        }
        setSubmittingReview(true)
        try {
            await businessService.addReview(businessId, newReview.rating, newReview.comment)
            toast.success("Review added!")
            setNewReview({ rating: 5, comment: "" })
            fetchReviews()
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to add review")
        } finally {
            setSubmittingReview(false)
        }
    }

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        className={cn("w-4 h-4", s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                    />
                ))}
            </div>
        )
    }

    return (
        <>
            {/* Products Tab */}
            <TabsContent value="products" className="mt-0">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loadingProducts ? (
                        <div className="col-span-full py-8 text-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading products...
                        </div>
                    ) : products.length > 0 ? (
                        products.map(product => (
                            <Card key={product.id} className="overflow-hidden border-border/50 bg-zinc-900/30">
                                {product.imageUrl && (
                                    <div className="h-48 w-full overflow-hidden">
                                        <img src={getMediaUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <CardHeader className="p-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{product.name}</CardTitle>
                                        <span className="font-bold text-primary">{product.currency} {product.price}</span>
                                    </div>
                                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-0">
                                    <Button 
                                        className="w-full rounded-full gap-2" 
                                        variant="secondary"
                                        onClick={() => product.ctaUrl && window.open(product.ctaUrl, '_blank')}
                                    >
                                        <ShoppingBag className="w-4 h-4" />
                                        Buy Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-bold">No products showcased yet</p>
                            <p className="text-sm">When this business lists products, they will appear here.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-0">
                <div className="p-4 space-y-4">
                    {currentUser?.id && currentUser.id !== profile.id && (
                        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <div>
                                <h3 className="font-bold">Had a good experience?</h3>
                                <p className="text-sm text-muted-foreground">Share your feedback with the community.</p>
                            </div>
                            <div className="mt-4 space-y-3">
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button 
                                            key={s} 
                                            onClick={() => setNewReview(prev => ({ ...prev, rating: s }))}
                                            className="p-1"
                                        >
                                            <Star className={cn("w-6 h-6", s <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                                        </button>
                                    ))}
                                </div>
                                <textarea 
                                    className="w-full bg-zinc-900 border border-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    placeholder="Write your review here..."
                                    rows={3}
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                />
                                <Button 
                                    className="rounded-full" 
                                    disabled={submittingReview}
                                    onClick={handleAddReview}
                                >
                                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Review"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {loadingReviews ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading reviews...
                        </div>
                    ) : reviews.length > 0 ? (
                        reviews.map(review => (
                            <div key={review.id} className="flex gap-3 p-4 border-b border-border/50">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={getMediaUrl(review.user?.profile?.avatar)} />
                                    <AvatarFallback>{review.user?.profile?.name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold">{review.user?.profile?.name}</div>
                                            <div className="text-sm text-muted-foreground">@{review.user?.profile?.handle}</div>
                                        </div>
                                        {renderStars(review.rating)}
                                    </div>
                                    <p className="mt-2 text-[15px] leading-relaxed">{review.comment}</p>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-bold">No reviews yet</p>
                            <p className="text-sm">Be the first to review this business!</p>
                        </div>
                    )}
                </div>
            </TabsContent>
        </>
    )
}
