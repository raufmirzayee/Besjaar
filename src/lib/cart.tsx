import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/**
 * Cart state.
 *
 * Lines live in localStorage so a cart survives a reload and a return visit.
 * Prices held here are for display only — checkout recalculates every total on
 * the server from the catalogue, so a tampered cart cannot change what is
 * charged.
 */

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  brand?: string | null;
  price: number;
  /** Regular price when the line is discounted, for showing the saving. */
  compareAtPrice?: number | null;
  imageUrl: string | null;
  /** Stock ceiling, so quantity controls cannot exceed what is available. */
  maxQuantity?: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  /** Total saving across discounted lines; 0 when nothing is on sale. */
  savings: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "besjaar-cart-v1";
const MAX_LINE_QUANTITY = 99;
const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number, max?: number): number {
  const ceiling = Math.min(max && max > 0 ? max : MAX_LINE_QUANTITY, MAX_LINE_QUANTITY);
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(Math.floor(quantity), ceiling));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      // Guard against a corrupt or older cart shape.
      setLines(
        parsed
          .filter(
            (line): line is CartLine =>
              line &&
              typeof line.productId === "string" &&
              typeof line.slug === "string" &&
              typeof line.price === "number",
          )
          .map((line) => ({
            ...line,
            quantity: clampQuantity(line.quantity ?? 1, line.maxQuantity),
          })),
      );
    } catch {
      /* ignore a corrupt cart rather than breaking the store */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines]);

  const addItem = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((l) => l.productId === line.productId);
      if (existing) {
        return current.map((l) =>
          l.productId === line.productId
            ? { ...l, ...line, quantity: clampQuantity(l.quantity + quantity, line.maxQuantity) }
            : l,
        );
      }
      return [...current, { ...line, quantity: clampQuantity(quantity, line.maxQuantity) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) =>
            l.productId === productId
              ? { ...l, quantity: clampQuantity(quantity, l.maxQuantity) }
              : l,
          ),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((current) => current.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      savings: lines.reduce(
        (sum, l) =>
          l.compareAtPrice && l.compareAtPrice > l.price
            ? sum + (l.compareAtPrice - l.price) * l.quantity
            : sum,
        0,
      ),
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [lines, isOpen, openCart, closeCart, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart moet binnen een CartProvider gebruikt worden");
  return ctx;
}
