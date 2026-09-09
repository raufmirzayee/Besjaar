// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";

import { contactSchema } from "../contact.server";
import { hasConsent, readConsent, writeConsent, clearConsent } from "../consent";

const valid = {
  name: "Rauf Mirzayee",
  email: "rauf@example.com",
  subject: "Vraag over mijn bestelling",
  message: "Kunnen jullie mijn bestelling nog aanpassen voor verzending?",
};

describe("contactSchema", () => {
  it("accepts a valid message", () => {
    expect(contactSchema.parse(valid).email).toBe("rauf@example.com");
  });

  it("rejects an invalid e-mail", () => {
    expect(() => contactSchema.parse({ ...valid, email: "nope" })).toThrow();
  });

  it("rejects a too short message", () => {
    expect(() => contactSchema.parse({ ...valid, message: "hoi" })).toThrow();
  });

  it("rejects a filled honeypot field", () => {
    expect(() => contactSchema.parse({ ...valid, company: "spambot" })).toThrow();
  });

  it("caps the message length", () => {
    expect(() => contactSchema.parse({ ...valid, message: "a".repeat(2001) })).toThrow();
  });
});

describe("cookie consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("CustomEvent", window.CustomEvent);
  });

  it("blocks analytics and marketing until a choice is made", () => {
    expect(readConsent()).toBeNull();
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);
    expect(hasConsent("necessary")).toBe(true);
  });

  it("only enables the accepted categories", () => {
    writeConsent({ analytics: true, marketing: false });
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("marketing")).toBe(false);
  });

  it("resets to blocked after clearing", () => {
    writeConsent({ analytics: true, marketing: true });
    clearConsent();
    expect(hasConsent("analytics")).toBe(false);
  });
});
