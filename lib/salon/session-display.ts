/** Detect text corrupted by non-UTF-8 DB seeding (e.g. Persian → ????) */
export function isCorruptedDisplayText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return /^[?\s]+$/.test(trimmed);
}

export function resolveSalonHeaderName(
  salonBrandName?: string | null,
  fallback = "سالن",
) {
  if (salonBrandName && !isCorruptedDisplayText(salonBrandName)) {
    return salonBrandName;
  }
  return fallback;
}

export function resolveSalonHeaderRole(role?: string | null, fallback = "مدیر سالن") {
  if (role && !isCorruptedDisplayText(role)) {
    return role;
  }
  return fallback;
}
