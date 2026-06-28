"use client";

import { useLocalStorage } from "./use-local-storage";

export interface SearchHistoryItem {
  id: string;
  query_image: string;
  timestamp: number;
  result_count: number;
}

export function useSearchHistory() {
  const [history, setHistory, clearHistory] = useLocalStorage<SearchHistoryItem[]>(
    "search-history",
    []
  );

  const addToHistory = (item: Omit<SearchHistoryItem, "id" | "timestamp">) => {
    const newItem: SearchHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 50));
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
