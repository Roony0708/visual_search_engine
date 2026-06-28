"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Tag, ChevronRight } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductMatch } from "@/services/api";

interface ProductCardProps {
  product: ProductMatch;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/product/${product.id}`}
        className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              {Math.round(product.similarity * 100)}% match
            </span>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span>{product.category}</span>
          </div>
          <h3 className="font-medium leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{formatPrice(product.price)}</span>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-primary">
              Details <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
