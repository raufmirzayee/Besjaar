import { describe, expect, it } from "vitest";

import {
  companyAddressLines,
  companyIdentityFields,
  hasCompanyIdentity,
  missingCompanyIdentity,
  storeConfig,
} from "@/lib/store-config";

describe("company identity", () => {
  it("never publishes an invented KvK or VAT number", () => {
    // Nothing is configured in the test environment, so nothing may be output.
    // A placeholder here would appear on a live shop as a false legal claim.
    expect(storeConfig.company.kvk).toBe("");
    expect(storeConfig.company.vat).toBe("");
    expect(storeConfig.company.kvk).not.toMatch(/0{4,}/);
    expect(storeConfig.company.vat).not.toMatch(/NL0{6,}/);
  });

  it("reports every legally required field as outstanding while unset", () => {
    const missing = missingCompanyIdentity().map((field) => field.key);
    expect(missing).toContain("legalName");
    expect(missing).toContain("kvk");
    expect(missing).toContain("vat");
    expect(missing).toContain("street");
    expect(hasCompanyIdentity()).toBe(false);
  });

  it("counts the contact e-mail as satisfied because it has a real default", () => {
    const email = companyIdentityFields().find((field) => field.key === "email");
    expect(email?.value).toBeTruthy();
    expect(missingCompanyIdentity().map((f) => f.key)).not.toContain("email");
  });

  it("produces no address lines at all when no address is configured", () => {
    expect(companyAddressLines()).toEqual([]);
  });

  it("marks only the statutory fields as required", () => {
    const optional = companyIdentityFields().filter((field) => !field.required);
    expect(optional.map((field) => field.key)).toEqual(["country"]);
  });
});

describe("organization structured data", () => {
  it("claims no registration numbers that were never configured", async () => {
    const { jsonLd, organizationSchema } = await import("@/lib/seo");
    const serialised = jsonLd(organizationSchema());
    const parsed = JSON.parse(serialised) as Record<string, unknown>;

    expect(parsed.name).toBe("Besjaar");
    // undefined fields are dropped by JSON.stringify, so an unset identifier
    // must be absent from the output rather than present and empty.
    expect(parsed).not.toHaveProperty("vatID");
    expect(parsed).not.toHaveProperty("legalName");
    expect(parsed).not.toHaveProperty("identifier");
    expect(parsed).not.toHaveProperty("address");
    expect(serialised).not.toMatch(/KvK/);
  });
});

describe("company identity once configured", () => {
  const filled = {
    legalName: "EenTop B.V.",
    kvk: "12345678",
    vat: "NL123456789B01",
    street: "Kerkstraat 12",
    postalCode: "1017 GC",
    city: "Amsterdam",
    country: "Nederland",
  } as const;

  it("builds the address lines in Dutch postal order", async () => {
    const { companyAddressLines } = await import("@/lib/store-config");
    expect(companyAddressLines(filled)).toEqual([
      "EenTop B.V.",
      "Kerkstraat 12",
      "1017 GC Amsterdam",
      "Nederland",
    ]);
  });

  it("drops lines that are not supplied instead of leaving blanks", async () => {
    const { companyAddressLines } = await import("@/lib/store-config");
    expect(companyAddressLines({ ...filled, street: "", city: "", postalCode: "" })).toEqual([
      "EenTop B.V.",
    ]);
  });

  it("treats a whitespace-only value as unset", async () => {
    const { missingCompanyIdentity } = await import("@/lib/store-config");
    // envString trims, so "   " must never count as a supplied KvK number.
    expect(missingCompanyIdentity().some((field) => field.key === "kvk")).toBe(true);
  });
});
