import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/**
 * Wishlist state.
 *
 * The list always works locally, so a visitor can save products before they
 * create an account. Once signed in, the local list is merged into the
 * customer's Supabase wishlist and stays in sync from there. If Supabase is
 * unreachable the local list still works — saving a product never fails.
 */

const STORAGE_KEY = "besjaar-wishlist-v1";

type WishlistContextValue = {
  items: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<"added" | "removed">;
  remove: (productId: string) => Promise<void>;
  clear: () => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readLocal(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>([]);
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    setItems(readLocal());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — the in-memory list still works this session */
    }
  }, [items]);

  // On sign-in, merge the guest list into the account's list, then adopt it.
  useEffect(() => {
    if (!user || mergedFor.current === user.id) return;
    mergedFor.current = user.id;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from("wishlist_items").select("product_id");
        if (error) throw new Error(error.message);
        const remote = (data ?? []).map((row: { product_id: string }) => row.product_id);
        const local = readLocal();
        const missing = local.filter((id) => !remote.includes(id));
        if (missing.length) {
          await supabase
            .from("wishlist_items")
            .insert(missing.map((id) => ({ product_id: id, user_id: user.id })));
        }
        if (!cancelled) setItems(Array.from(new Set([...remote, ...local])));
      } catch (error) {
        // Keep the local list; the wishlist must not break on a failed sync.
        console.warn("[wishlist] could not sync with the account:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persist = useCallback(
    async (productId: string, action: "added" | "removed") => {
      if (!user) return;
      try {
        if (action === "added") {
          await supabase.from("wishlist_items").insert({ product_id: productId, user_id: user.id });
        } else {
          await supabase
            .from("wishlist_items")
            .delete()
            .eq("product_id", productId)
            .eq("user_id", user.id);
        }
      } catch (error) {
        console.warn("[wishlist] could not save to the account:", error);
      }
    },
    [user],
  );

  const toggle = useCallback(
    async (productId: string) => {
      const isSaved = items.includes(productId);
      const action = isSaved ? ("removed" as const) : ("added" as const);
      setItems((current) =>
        isSaved ? current.filter((id) => id !== productId) : [...current, productId],
      );
      await persist(productId, action);
      return action;
    },
    [items, persist],
  );

  const remove = useCallback(
    async (productId: string) => {
      setItems((current) => current.filter((id) => id !== productId));
      await persist(productId, "removed");
    },
    [persist],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      has: (productId: string) => items.includes(productId),
      toggle,
      remove,
      clear: () => setItems([]),
      count: items.length,
    }),
    [items, toggle, remove],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside a WishlistProvider");
  return context;
}
