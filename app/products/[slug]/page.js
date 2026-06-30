"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ShoppingCart, Heart, Minus, Plus, ChevronLeft,
  ChevronRight, Package, Shield, Truck, RefreshCw, Share2, Camera, X
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getProductBySlug, submitReview } from "@/lib/services/product.service";
import { addToCart as apiAddToCart } from "@/lib/services/cart.service";
import { addToWishlist, checkWishlist, removeFromWishlist } from "@/lib/services/user.service";
import { useDispatch, useSelector } from "react-redux";
import { setCart } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";
import Link from "next/link";

function StarRating({ value = 0, count = 0, interactive = false, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          onClick={() => interactive && onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${interactive ? "cursor-pointer" : ""} w-5 h-5 transition-colors ${
            s <= (hover || Math.round(value))
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
      {!interactive && (
        <span className="text-sm text-muted-foreground ml-1">
          {value > 0 ? value.toFixed(1) : "No ratings"} {count > 0 && `(${count} reviews)`}
        </span>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, role, user } = useSelector((s) => s.auth);

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data.product);
        setReviews(data.reviews || []);
      })
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (product && isAuthenticated && role === "customer") {
      checkWishlist(product._id).then(setInWishlist).catch(() => {});
    }
  }, [product, isAuthenticated, role]);

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) { toast.error("Please log in to add to wishlist"); router.push("/login"); return; }
    if (role !== "customer") { toast.error("Only customers have a wishlist"); return; }
    setWishlisting(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(product._id);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product._id);
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error(err?.message ?? "Failed to update wishlist");
    } finally {
      setWishlisting(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setReviewImages((prev) => [...prev, ...Array.from(e.target.files)].slice(0, 3)); // Max 3 images
    }
  };

  const removeReviewImage = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Please log in to review"); router.push("/login"); return; }
    if (reviewRating === 0) { toast.error("Please select a rating"); return; }
    
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append("productId", product._id);
      formData.append("rating", reviewRating);
      if (reviewComment) formData.append("comment", reviewComment);
      reviewImages.forEach((file) => formData.append("images", file));

      const newReview = await submitReview(formData);
      
      setReviews(prev => {
        const filtered = prev.filter(r => r.customer?._id !== user?._id);
        return [newReview, ...filtered];
      });
      
      setReviewRating(0);
      setReviewComment("");
      setReviewImages([]);
      toast.success("Review submitted successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error("Please log in to add to cart"); router.push("/login"); return; }
    if (role !== "customer") { toast.error("Only customers can add to cart"); return; }
    setAdding(true);
    try {
      const data = await apiAddToCart({ productId: product._id, quantity });
      dispatch(setCart(data?.cart));
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err?.message ?? "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9]">
        <Navbar />
        <div className="pt-[72px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
            <div className="aspect-square bg-secondary rounded-2xl" />
            <div className="space-y-4">
              <div className="h-6 bg-secondary rounded w-1/3" />
              <div className="h-8 bg-secondary rounded" />
              <div className="h-8 bg-secondary rounded w-2/3" />
              <div className="h-4 bg-secondary rounded w-1/2" />
              <div className="h-24 bg-secondary rounded" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-[72px] text-center p-6">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Product not found</h1>
          <Link href="/shop" className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90">
            Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images ?? [];
  const price = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <div className="pt-[72px]">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                <span className="text-foreground">{product.category.name}</span>
              </>
            )}
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* ── Left: Images ── */}
            <div className="space-y-3">
              {/* Main image */}
              <div className="relative aspect-square bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    src={images[activeImg]?.url}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-contain p-4"
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((v) => Math.max(0, v - 1))}
                      disabled={activeImg === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center border border-border/50 disabled:opacity-40 hover:bg-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveImg((v) => Math.min(images.length - 1, v + 1))}
                      disabled={activeImg === images.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur rounded-full shadow flex items-center justify-center border border-border/50 disabled:opacity-40 hover:bg-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {hasDiscount && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    -{discountPct}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${i === activeImg ? "border-primary shadow-md" : "border-border/50 hover:border-primary/40"}`}
                    >
                      <img src={img.url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: Details ── */}
            <div className="space-y-5">
              {/* Category & Seller */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wide">
                  {product.category?.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    disabled={wishlisting || role === "seller" || role === "admin"}
                    className={`p-2 rounded-full border transition-all ${inWishlist ? "bg-red-50 border-red-200 text-red-500" : "border-border hover:bg-secondary text-muted-foreground"} disabled:opacity-40 disabled:cursor-not-allowed`}
                    title="Wishlist"
                  >
                    {wishlisting ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Heart className={`w-4 h-4 ${inWishlist ? "fill-red-500" : ""}`} />
                    )}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                    className="p-2 rounded-full border border-border hover:bg-secondary transition-all text-muted-foreground"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
                {product.name}
              </h1>

              {/* Ratings */}
              <StarRating value={product.ratings?.average} count={product.ratings?.count} />

              {/* Price */}
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                  ₹{price.toLocaleString("en-IN")}
                </p>
                {hasDiscount && (
                  <>
                    <p className="text-lg text-muted-foreground line-through">₹{product.price.toLocaleString("en-IN")}</p>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Save ₹{(product.price - product.discountPrice).toLocaleString("en-IN")}
                    </span>
                  </>
                )}
              </div>

              {/* Stock status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-500"}`} />
                <p className={`text-sm font-medium ${inStock ? "text-emerald-700" : "text-red-600"}`}>
                  {inStock ? `In Stock (${product.stock} available)` : "Out of Stock"}
                </p>
              </div>


              {/* Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs px-3 py-1 bg-secondary rounded-full text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Seller */}
              <p className="text-xs text-muted-foreground">
                Sold by <span className="font-semibold text-foreground">{product.seller?.name ?? "ShopEase Seller"}</span>
              </p>

              {/* Quantity + Actions */}
              {inStock && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-foreground">Qty:</label>
                    <div className="flex items-center border border-border rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={adding || role === "seller" || role === "admin"}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary border border-primary/30 rounded-xl font-semibold text-sm hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {adding ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                      Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={adding || role === "seller" || role === "admin"}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                {[
                  { icon: Truck, label: "Free shipping", sub: "On orders above ₹500" },
                  { icon: Shield, label: "Secure payment", sub: "Razorpay protected" },
                  { icon: RefreshCw, label: "Easy returns", sub: "7-day return policy" },
                  { icon: Package, label: "Fast delivery", sub: "2–5 business days" },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex items-start gap-2.5 p-3 bg-secondary/40 rounded-xl">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* ── Product Description ── */}
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Product Description
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap max-w-full">
              {product.description}
            </p>
          </div>

          {/* ── Reviews Section ── */}
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "Manrope, sans-serif" }}>
              Customer Reviews
            </h2>

            {isAuthenticated && role === "customer" && (
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-border/50 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-foreground mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                    <StarRating value={reviewRating} interactive onRate={setReviewRating} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Comment (Optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full bg-secondary/30 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Images (Optional, max 3)</label>
                    <div className="flex flex-wrap gap-3">
                      {reviewImages.map((file, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReviewImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {reviewImages.length < 3 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 rounded-xl border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-primary"
                        >
                          <Camera className="w-5 h-5" />
                          <span className="text-[10px] font-medium">Add Photo</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {submittingReview ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Submit Review"}
                  </button>
                </form>
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">No reviews yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-white p-5 rounded-2xl border border-border/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                        {review.customer?.avatar?.url ? (
                          <img src={review.customer.avatar.url} alt={review.customer.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-foreground">{review.customer?.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{review.customer?.name}</p>
                        <div className="mt-0.5">
                          <StarRating value={review.rating} />
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground mt-3">{review.comment}</p>}
                    {review.images?.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {review.images.map((img, i) => (
                          <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                            <img src={img.url} alt="Review attachment" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
