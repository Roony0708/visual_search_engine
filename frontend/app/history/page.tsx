"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Trash2,
  Search,
  Clock,
  ImageIcon,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface SearchHistoryItem {
  id: string;
  query_image: string;
  timestamp: number;
  result_count: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("search-history");
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("search-history");
    setHistory([]);
  };

  const removeItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("search-history", JSON.stringify(updated));
  };

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

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Search History</h1>
            <p className="text-sm text-muted-foreground">
              {history.length} previous searches
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md py-16 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No Search History</h2>
          <p className="mt-2 text-muted-foreground">
            Your visual search history will appear here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
            Start a Search
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  <img
                    src={item.query_image || "/placeholder.svg"}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    {item.result_count} results found
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
