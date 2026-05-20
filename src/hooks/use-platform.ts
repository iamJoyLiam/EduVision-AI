import { platform } from "@tauri-apps/plugin-os";

type Platform = "macos" | "windows" | "linux";

export function usePlatform(): Platform {
  try {
    const p = platform();
    if (p === "macos") return "macos";
    if (p === "windows") return "windows";
    return "linux";
  } catch {
    // Fallback for browser dev context (no Tauri runtime)
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) return "macos";
    if (ua.includes("win")) return "windows";
    return "linux";
  }
}
