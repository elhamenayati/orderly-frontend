import { resolveMediaUrl } from "@/lib/api/client";

const STORAGE_KEY = "mahoura:stylistAvatarPaths";

/** Default avatar when a stylist/user has no uploaded profile picture. */
export const DEFAULT_AVATAR_PATH = "/images/salon/default-avatar.png";

export function readStylistAvatarOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function persistStylistAvatarPath(stylistId: string, path: string) {
  if (typeof window === "undefined") return;
  const overrides = readStylistAvatarOverrides();
  overrides[stylistId] = path;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function resolveStylistAvatarPath(
  stylistId: string,
  fallback?: string,
): string | undefined {
  const overrides = readStylistAvatarOverrides();
  return overrides[stylistId] ?? fallback;
}

/** Turn stored stylist avatar paths into browser-loadable URLs. */
export function stylistAvatarSrc(path?: string | null): string {
  if (!path?.trim()) return DEFAULT_AVATAR_PATH;
  return resolveMediaUrl(path) || DEFAULT_AVATAR_PATH;
}
