import { create } from "zustand";

export type AppMode = "browse" | "solve";

interface UIState {
  mode: AppMode;
  leftOpen: boolean;
  rightOpen: boolean;
  bottomOpen: boolean;
  settingsOpen: boolean;
  setMode: (mode: AppMode) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleBottom: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mode: "browse",
  leftOpen: true,
  rightOpen: false,
  bottomOpen: true,
  settingsOpen: false,
  setMode: (mode) => set({ mode }),
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  toggleBottom: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
