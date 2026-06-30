"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchRedirectPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#fafaf9]" />}>
      <SearchRedirectContent />
    </React.Suspense>
  );
}

function SearchRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  useEffect(() => {
    if (q) {
      router.replace(`/shop?q=${encodeURIComponent(q)}`);
    } else {
      router.replace("/shop");
    }
  }, [q, router]);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
