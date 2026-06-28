"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Search, History, ImageIcon } from "lucide-react";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <ImageIcon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            VisualSearch
          </span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <History className="h-4 w-4" />
            <span className="hidden md:inline">History</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
