export const CONSENT_STORAGE_KEY = "besjaar-cookie-consent";
export const CONSENT_EVENT = "besjaar-consent-change";

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decidedAt: String(parsed.decidedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

/** No tracker may run before the visitor has actively allowed that category. */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  const consent = readConsent();
  return consent ? consent[category] : false;
}

export function writeConsent(next: { analytics: boolean; marketing: boolean }): Consent {
  const consent: Consent = {
    necessary: true,
    analytics: next.analytics,
    marketing: next.marketing,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    } catch {
      /* storage unavailable — keep session-only choice */
    }
    window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: consent }));
  }
  return consent;
}

export function clearConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}
