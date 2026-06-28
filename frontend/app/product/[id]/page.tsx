"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, Calendar, Loader2, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { UploadArea } from "@/components/upload-area";
import { getProduct, searchByImage } from "@/services/api";
import type { Product } from "@/services/api";
import { formatPrice } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    getProduct(params.id as string)
      .then((data) => setProduct(data))
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSearchByImage = async (file: File) => {
    setSearching(true);
    try {
      const result = await searchByImage(file, 20);
      const encoded = btoa(JSON.stringify(result));
      router.push(`/search?data=${encoded}`);
    } catch {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-32 animate-pulse rounded bg-muted" />
              <div className="h-20 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The product you are looking for does not exist or has been removed.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
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

      <div className="grid gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted shadow-lg">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Tag className="h-3 w-3" />
              {product.category}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <p className="text-4xl font-bold text-primary">
            {formatPrice(product.price)}
          </p>

          {product.description && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {product.created_at
              ? new Date(product.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Date unavailable"}
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" />
              Search with this image
            </h3>
            <UploadArea onImageSelected={handleSearchByImage} isLoading={searching} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
