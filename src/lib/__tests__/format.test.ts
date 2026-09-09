import { describe, expect, it } from "vitest";

import { discountPercentage, effectivePrice, formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("formats numbers as euro amounts", () => {
    expect(formatPrice(12.5).replace(/\u00a0/g, " ")).toBe("€ 12,50");
  });

  it("accepts numeric strings", () => {
    expect(formatPrice("9.99").replace(/\u00a0/g, " ")).toBe("€ 9,99");
  });

  it("falls back to zero for invalid input", () => {
    expect(formatPrice(null).replace(/\u00a0/g, " ")).toBe("€ 0,00");
    expect(formatPrice("abc").replace(/\u00a0/g, " ")).toBe("€ 0,00");
  });
});

describe("discountPercentage", () => {
  it("returns the rounded discount", () => {
    expect(discountPercentage(100, 75)).toBe(25);
    expect(discountPercentage(29.99, 19.99)).toBe(33);
  });

  it("returns null when there is no valid discount", () => {
    expect(discountPercentage(100, null)).toBeNull();
    expect(discountPercentage(100, 100)).toBeNull();
    expect(discountPercentage(100, 120)).toBeNull();
    expect(discountPercentage(0, 0)).toBeNull();
  });
});

describe("effectivePrice", () => {
  it("prefers a lower sale price", () => {
    expect(effectivePrice(50, 40)).toBe(40);
    expect(effectivePrice(50, 60)).toBe(50);
    expect(effectivePrice(50, null)).toBe(50);
  });
});
