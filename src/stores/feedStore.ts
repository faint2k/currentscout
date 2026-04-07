"use client";

import { create } from "zustand";
import type { FeedFilters, SortMode, TimeFilter } from "../lib/reddit/types";

interface FeedStore {
  filters:    FeedFilters;
  setFilters: (partial: Partial<FeedFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: FeedFilters = {
  sort:       "weighted",
  time:       "24h",
  subreddits: [],
  categories: [],
  minScore:   0,
  search:     "",
};

export const useFeedStore = create<FeedStore>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
