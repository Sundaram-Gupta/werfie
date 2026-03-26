import { useState, useEffect } from "react"
import { Plus, Search, ShoppingBag, Edit2, Trash2, Loader2, Save, X, ImageIcon, Upload, Image as ImageLucide } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { businessService, mediaService } from "@/services/api"
import { getMediaUrl } from "@/lib/utils"

export default function ProductManagement() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formLoading, setFormLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    
    const currencies = [
        { code: "USD", symbol: "$", name: "US Dollar" },
        { code: "EUR", symbol: "€", name: "Euro" },
        { code: "GBP", symbol: "£", name: "British Pound" },
        { code: "INR", symbol: "₹", name: "Indian Rupee" },
        { code: "JPY", symbol: "¥", name: "Japanese Yen" },
        { code: "AUD", symbol: "A$", name: "Australian Dollar" },
        { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
        { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    ]

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [currency, setCurrency] = useState("USD")
    const [imageUrl, setImageUrl] = useState("")
    const [ctaUrl, setCtaUrl] = useState("")

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const data = await businessService.getProducts("me") // Use "me" or actual business ID
            setProducts(data || [])
        } catch (err) {
            console.error("Failed to fetch products:", err)
            toast.error("Failed to load products")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (product = null) => {
        setEditingProduct(product)
        if (product) {
            setName(product.name || "")
            setDescription(product.description || "")
            setPrice(product.price?.toString() || "")
            // Normalize currency (e.g. RUPEES -> INR)
            const curr = (product.currency || "USD").toUpperCase()
            setCurrency(curr === "RUPEES" ? "INR" : curr)
            setImageUrl(product.imageUrl || "")
            setCtaUrl(product.ctaUrl || "")
        } else {
            setName("")
            setDescription("")
            setPrice("")
            setCurrency("USD")
            setImageUrl("")
            setCtaUrl("")
        }
        setIsModalOpen(true)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        try {
            const payload = {
                name,
                description,
                price: parseFloat(price),
                currency,
                imageUrl,
                ctaUrl
            }

            if (editingProduct) {
                await businessService.updateProduct(editingProduct.id, payload)
                toast.success("Product updated successfully")
            } else {
                await businessService.addProduct(payload)
                toast.success("Product added successfully")
            }
            setIsModalOpen(false)
            fetchProducts()
        } catch (err) {
            console.error("Save error:", err)
            toast.error("Failed to save product")
        } finally {
            setFormLoading(false)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            const result = await mediaService.uploadMedia(file)
            // The media service returns { status: true, data: { url: "..." } }
            const url = result?.data?.url || result?.url || result?.mediaUrl
            if (url) {
                setImageUrl(url)
                toast.success("Image uploaded")
            }
        } catch (err) {
            console.error("Upload error:", err)
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return
        try {
            await businessService.deleteProduct(id)
            toast.success("Product deleted")
            fetchProducts()
        } catch (err) {
            toast.error("Failed to delete product")
        }
    }

    const getCurrencySymbol = (code) => {
        return currencies.find(c => c.code === code)?.symbol || code
    }

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.description?.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex justify-center items-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search products..." 
                        className="pl-10 bg-zinc-900 border-border" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button className="rounded-full bg-blue-500 hover:bg-blue-600 text-white gap-2 w-full md:w-auto" onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4" />
                    Add Product
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-zinc-900/50 border border-border/50 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all">
                        <div className="aspect-[4/3] bg-zinc-800 relative">
                            {product.imageUrl ? (
                                <img src={getMediaUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                                    <span className="text-xs uppercase font-bold tracking-widest opacity-40">No Image</span>
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="secondary" className="w-8 h-8 rounded-full shadow-lg" onClick={() => handleOpenModal(product)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="destructive" className="w-8 h-8 rounded-full shadow-lg" onClick={() => handleDelete(product.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg truncate flex-1 mr-2">{product.name}</h3>
                                <div className="text-blue-400 font-bold">
                                    {getCurrencySymbol(product.currency)} {product.price}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                                {product.description || "No description provided."}
                            </p>
                            <Button variant="outline" className="w-full rounded-full text-xs font-bold uppercase tracking-wider h-9" 
                                onClick={() => product.ctaUrl && window.open(product.ctaUrl, '_blank')}
                                disabled={!product.ctaUrl}
                            >
                                <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                                View Landing Page
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No products found. Start by adding your first product!</p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-black border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
                            <Input 
                                required 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="bg-zinc-900 border-border"
                                placeholder="e.g. Premium Subscription"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price</label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    value={price} 
                                    onChange={e => setPrice(e.target.value)} 
                                    className="bg-zinc-900 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Currency</label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="bg-zinc-900 border-border">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        {currencies.map((curr) => (
                                            <SelectItem key={curr.code} value={curr.code}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-400 min-w-[20px]">{curr.symbol}</span>
                                                    <span>{curr.code}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">({curr.name})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                            <Textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                className="bg-zinc-900 border-border min-h-[100px]"
                                placeholder="Describe what you're selling..."
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Image</label>
                            
                            <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-dashed border-zinc-800 flex flex-col items-center justify-center group cursor-pointer hover:border-blue-500/50 transition-all"
                                onClick={() => !uploading && document.getElementById('product-image-upload').click()}
                            >
                                {imageUrl ? (
                                    <>
                                        <img src={getMediaUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageLucide className="w-8 h-8 opacity-20" />}
                                        <span className="text-xs font-medium">{uploading ? "Uploading..." : "Click to upload image"}</span>
                                    </div>
                                )}
                                <input 
                                    id="product-image-upload"
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                            
                            {imageUrl && (
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="truncate max-w-[200px]">{imageUrl}</span>
                                    <button 
                                        type="button" 
                                        className="text-red-400 hover:text-red-300 font-bold uppercase"
                                        onClick={() => setImageUrl("")}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Landing Page URL (CTA)</label>
                            <Input 
                                value={ctaUrl} 
                                onChange={e => setCtaUrl(e.target.value)} 
                                className="bg-zinc-900 border-border"
                                placeholder="https://yourstore.com/product"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={formLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-8" disabled={formLoading}>
                                {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Product
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
