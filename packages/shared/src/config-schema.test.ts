import { describe, expect, it } from "vitest";

import { parseConfig } from "./config-schema.js";

describe("parseConfig", () => {
  it("applies the global default outbound provider when a domain does not override it", () => {
    const config = parseConfig({
      defaults: {
        outboundProvider: "resend-smtp"
      },
      domains: [
        {
          domain: "brand-a.com",
          defaultIdentityEmail: "support@brand-a.com",
          allowedIdentities: ["support@brand-a.com"],
          displayNames: {
            "support@brand-a.com": "Brand A Support"
          }
        }
      ]
    });

    expect(config.defaults.outboundProvider).toBe("resend-smtp");
    expect(config.domains[0]?.outboundProvider).toBeUndefined();
  });

  it("rejects identities outside the declared domain", () => {
    expect(() =>
      parseConfig({
        domains: [
          {
            domain: "brand-a.com",
            defaultIdentityEmail: "support@other.com",
            allowedIdentities: ["support@other.com"],
            displayNames: {}
          }
        ]
      })
    ).toThrow(/must belong to domain/i);
  });

  it("preserves a domain-level outbound provider selection", () => {
    const config = parseConfig({
      defaults: {
        outboundProvider: "mock"
      },
      domains: [
        {
          domain: "brand-a.com",
          outboundProvider: "resend-smtp",
          defaultIdentityEmail: "support@brand-a.com",
          allowedIdentities: ["support@brand-a.com"],
          displayNames: {
            "support@brand-a.com": "Brand A Support"
          }
        }
      ]
    });

    expect(config.domains[0]?.outboundProvider).toBe("resend-smtp");
  });

  it("does not expose the deprecated active identity limit in parsed config", () => {
    const config = parseConfig({
      defaults: {
        outboundProvider: "mock",
        maxActiveIdentities: 5
      } as Record<string, unknown>,
      domains: [
        {
          domain: "brand-a.com",
          defaultIdentityEmail: "support@brand-a.com",
          allowedIdentities: ["support@brand-a.com"],
          displayNames: {
            "support@brand-a.com": "Brand A Support"
          }
        }
      ]
    });

    expect("maxActiveIdentities" in config.defaults).toBe(false);
  });
});
