"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

const STORAGE_PREFIX = "salon-filters:";

/** Menu section a salon path belongs to; detail pages share their list's section. */
export function salonFilterSection(pathname: string): string | null {
  const [root, section, subsection] = pathname.split("/").filter(Boolean);
  if (root !== "salon" || !section) return null;
  return section === "reports" ? `reports/${subsection ?? ""}` : section;
}

/** Drops saved list filters that belong to any section other than the current one. */
export function clearFiltersOutsideSection(section: string | null) {
  const keep = section ? `${STORAGE_PREFIX}${section}:` : null;
  const stale: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX) && (!keep || !key.startsWith(keep))) {
      stale.push(key);
    }
  }
  for (const key of stale) sessionStorage.removeItem(key);
}

/**
 * `useState` for a list filter that survives visiting a detail page and coming
 * back. Starts from `initial` on the server and restores after mount, so markup
 * matches during hydration.
 */
export function usePersistentFilter<T>(
  section: string,
  name: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const key = `${STORAGE_PREFIX}${section}:${name}`;
  const [value, setValue] = useState<T>(initial);
  const restored = useRef(false);
  const skipNextWrite = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(key);
    if (raw !== null) {
      try {
        setValue(JSON.parse(raw) as T);
        skipNextWrite.current = true;
      } catch {
        sessionStorage.removeItem(key);
      }
    }
    restored.current = true;
  }, [key]);

  useEffect(() => {
    if (!restored.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
