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
