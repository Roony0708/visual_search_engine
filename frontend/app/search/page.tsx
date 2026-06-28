"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  SlidersHorizontal,
  Search as SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { UploadArea } from "@/components/upload-area";
import { ProductCard } from "@/components/product-card";
import type { SearchResponse } from "@/services/api";

function parseSearchData(searchParams: URLSearchParams): SearchResponse | null {
  try {
    const data = searchParams.get("data");
    if (!data) return null;
    return JSON.parse(atob(data));
  } catch {
    return null;
  }
}

type SortMode = "relevance" | "price-asc" | "price-desc";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const data = useMemo(() => parseSearchData(searchParams), [searchParams]);

  const categories = useMemo(() => {
    if (!data) return [];
    const cats = new Set(data.matches.map((m) => m.category));
    return ["all", ...Array.from(cats)];
  }, [data]);

  const filteredAndSorted = useMemo(() => {
    if (!data) return [];

    let items = [...data.matches];

    if (categoryFilter !== "all") {
      items = items.filter((m) => m.category === categoryFilter);
    }

    switch (sortMode) {
      case "price-asc":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items.sort((a, b) => b.price - a.price);
        break;
      case "relevance":
      default:
        items.sort((a, b) => b.similarity - a.similarity);
        break;
    }

    return items;
  }, [data, sortMode, categoryFilter]);

  const handleNewSearch = (file: File) => {
    setIsSearching(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("top_k", "20");

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/search`,
      { method: "POST", body: fd }
    )
      .then((r) => r.json())
      .then((d) => {
        const encoded = btoa(JSON.stringify(d));
        const history = JSON.parse(
          localStorage.getItem("search-history") || "[]"
        );
        history.unshift({
          id: crypto.randomUUID(),
          query_image: d.query_image,
          timestamp: Date.now(),
          result_count: d.matches.length,
        });
        localStorage.setItem(
          "search-history",
          JSON.stringify(history.slice(0, 50))
        );
        window.location.href = `/search?data=${encoded}`;
      })
      .catch(() => setIsSearching(false));
  };

  if (!data) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <SearchIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">No Search Results</h1>
          <p className="mt-2 text-muted-foreground">
            Upload an image to find visually similar products.
          </p>
          <div className="mt-8">
            <UploadArea onImageSelected={handleNewSearch} isLoading={isSearching} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </motion.div>

      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_2fr] lg:grid-cols-[1fr_3fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Query Image
            </h3>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={data.query_image || "/placeholder.svg"}
                alt="Query"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {data.matches.length} results found
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <UploadArea onImageSelected={handleNewSearch} isLoading={isSearching} />
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {filteredAndSorted.length} Products
              </span>
            </div>

            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price-asc">Sort: Price (Low)</option>
                <option value="price-desc">Sort: Price (High)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-16 text-center">
          <div className="mx-auto max-w-lg">
            <div className="mx-auto mb-6 h-20 w-20 animate-shimmer rounded-2xl bg-muted bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
