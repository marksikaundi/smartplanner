import { create } from "zustand";
import { Listing } from "@/types/models";

type MarketState = {
  savedIds: string[];
  recentViewed: Listing[];
  toggleSaved: (id: string) => void;
  addViewed: (listing: Listing) => void;
};

export const useMarketStore = create<MarketState>((set, get) => ({
  savedIds: [],
  recentViewed: [],
  toggleSaved: (id) => {
    const has = get().savedIds.includes(id);
    set({ savedIds: has ? get().savedIds.filter((x) => x !== id) : [...get().savedIds, id] });
  },
  addViewed: (listing) => {
    const next = [listing, ...get().recentViewed.filter((x) => x.id !== listing.id)].slice(0, 10);
    set({ recentViewed: next });
  },
}));
