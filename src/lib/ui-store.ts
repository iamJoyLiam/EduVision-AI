import { create } from "zustand";

interface UIState {
  leftOpen: boolean;
  rightOpen: boolean;
  bottomOpen: boolean;
  settingsOpen: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleBottom: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftOpen: true,
  rightOpen: false,
  bottomOpen: true,
  settingsOpen: false,
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  toggleBottom: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
