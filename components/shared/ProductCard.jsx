"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, Star } from "lucide-react";
import { useDispatch } from "react-redux";
import { addToCart } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";
import { useState } from "react";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [adding, setAdding] = useState(false);

  const { name, category, price, discountPrice, ratings, images, isFeatured, stock, slug } = product;
  const imageUrl = images?.[0]?.url;
  const inStock = stock > 0;
  const avgRating = ratings?.average ?? 0;
  const reviewCount = ratings?.count ?? 0;
  
  const displayPrice = discountPrice ?? price;
  const hasDiscount = discountPrice && discountPrice < price;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!inStock) return;
    
    setAdding(true);
    try {
      dispatch(addToCart({ product, quantity: 1 }));
      toast.success(`${name} added to cart!`);
    } catch (err) {
      toast.error(err?.message || "Failed to add to cart. Please log in.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="product-card bg-card border border-border rounded-2xl p-4 md:p-5 flex flex-col gap-4 group hover:shadow-lg transition-all duration-300"
    >
      <Link href={`/products/${slug}`}>
        <div className="relative aspect-square bg-secondary rounded-xl flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          ) : (
            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">🛍️</span>
          )}
          {isFeatured && (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
              Featured
            </span>
          )}
          {!inStock && (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-1 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
          {category?.name ?? "Product"}
        </p>
        <Link href={`/products/${slug}`}>
          <h3
            className="font-semibold text-foreground text-sm leading-snug line-clamp-2 hover:text-primary transition-colors"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {name}
          </h3>
        </Link>
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.floor(avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex flex-col">
          <span className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!inStock || adding}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
        >
          {adding ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
