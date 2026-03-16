"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type StudioState = {
  recentTools: string[];
  starredTools: string[];
  markRecent: (slug: string) => void;
  toggleStar: (slug: string) => void;
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      recentTools: [],
      starredTools: [],
      markRecent: (slug) =>
        set((state) => ({
          recentTools: [slug, ...state.recentTools.filter((item) => item !== slug)].slice(
            0,
            6
          )
        })),
      toggleStar: (slug) =>
        set((state) => ({
          starredTools: state.starredTools.includes(slug)
            ? state.starredTools.filter((item) => item !== slug)
            : [...state.starredTools, slug]
        }))
    }),
    {
      name: "lightning-studio-store"
    }
  )
);
