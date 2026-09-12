import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Recently viewed products.
 *
 * Stored per browser in localStorage — no account needed and nothing sent to
 * the server. Only product slugs are kept, so the list stays small and always
 * resolves against the current catalogue.
 */

const STORAGE_KEY = "besjaar-recently-viewed-v1";
const MAX_ENTRIES = 12;

type RecentlyViewedContextValue = {
  slugs: string[];
  record: (slug: string) => void;
  clear: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setSlugs(parsed.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const record = useCallback((slug: string) => {
    setSlugs((current) => {
      const next = [slug, ...current.filter((value) => value !== slug)].slice(0, MAX_ENTRIES);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSlugs([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(() => ({ slugs, record, clear }), [slugs, record, clear]);

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error("useRecentlyViewed must be used inside a RecentlyViewedProvider");
  return context;
}
