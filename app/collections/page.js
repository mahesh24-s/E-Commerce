"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getAllCollections } from "@/lib/services/collection.service";

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCollections()
      .then((data) => setCollections(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-[72px]">
        {/* Header */}
        <div className="bg-primary/5 py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Curated Collections
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover products handpicked for every season, style, and setup. Explore our featured collections below.
            </p>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[300px] bg-secondary rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛍️</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">No collections found</h2>
              <p className="text-muted-foreground">Check back later for curated product lists!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((collection, i) => (
                <Link key={collection._id} href={`/collections/${collection.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group relative h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white"
                  >
                    {collection.bannerImage?.url ? (
                      <Image
                        src={collection.bannerImage.url}
                        alt={collection.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl">✨</span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                      <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {collection.name}
                      </h2>
                      {collection.description && (
                        <p className="text-white/80 line-clamp-2 text-sm md:text-base">
                          {collection.description}
                        </p>
                      )}
                      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-[#9cd2b5] transition-colors">
                        Explore Collection <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
