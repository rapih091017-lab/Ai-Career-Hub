"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "interview-bookmarks";

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        setBookmarkedIds(new Set(parsed));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Persist to localStorage
  const persist = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.has(id),
    [bookmarkedIds]
  );

  const bookmarkCount = bookmarkedIds.size;

  return {
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
    bookmarkCount,
  };
}
