"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ProductCard from "@/components/shared/ProductCard";
import { getCollectionBySlug } from "@/lib/services/collection.service";
import toast from "react-hot-toast";

export default function CollectionDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    getCollectionBySlug(slug)
      .then((data) => {
        if (!data) {
          toast.error("Collection not found");
          router.push("/collections");
          return;
        }
        setCollection(data);
      })
      .catch((err) => {
        toast.error(err?.message || "Failed to load collection");
        router.push("/collections");
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col pt-[72px]">
          <div className="w-full h-[400px] bg-secondary animate-pulse" />
          <div className="max-w-7xl mx-auto w-full px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-secondary rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!collection) return null;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-[72px]">
        {/* Banner Section */}
        <div className="relative w-full h-[300px] md:h-[450px] bg-primary flex items-center justify-center overflow-hidden">
          {collection.bannerImage?.url ? (
            <Image
              src={collection.bannerImage.url}
              alt={collection.name}
              fill
              className="object-cover opacity-50"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#002819] to-[#06402b] opacity-90" />
          )}
          
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-8">
            <Link 
              href="/collections"
              className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Collections
            </Link>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                {collection.description}
              </p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              Curated Products ({collection.products?.length || 0})
            </h2>
          </div>

          {collection.products?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-sm">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-foreground mb-2">Empty Collection</h3>
              <p className="text-muted-foreground">Products will be added here soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {collection.products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
