import { z } from "zod";

import { normalizeEmailAddress } from "./email-normalization.js";

const outboundProviderSchema = z.enum(["mock", "resend-smtp", "ses"]);

const domainEntrySchema = z.object({
  domain: z.string().min(1),
  outboundProvider: outboundProviderSchema.optional(),
  defaultIdentityEmail: z.string().email(),
  allowedIdentities: z.array(z.string().email()).min(1),
  displayNames: z.record(z.string(), z.string())
});

const configSchema = z.object({
  defaults: z
    .object({
      outboundProvider: outboundProviderSchema.default("mock")
    })
    .default({
      outboundProvider: "mock"
    }),
  server: z
    .object({
      smtpHost: z.string(),
      smtpPort: z.number().int().positive(),
      httpHost: z.string(),
      httpPort: z.number().int().positive()
    })
    .optional(),
  domains: z.array(domainEntrySchema).min(1)
});

export type OhrelayConfig = z.infer<typeof configSchema>;

export function parseConfig(input: unknown): OhrelayConfig {
  const config = configSchema.parse(input);
  const seenIdentities = new Set<string>();

  for (const domainEntry of config.domains) {
    const domain = domainEntry.domain.toLowerCase();
    const normalizedAllowed: string[] = domainEntry.allowedIdentities.map((identity) =>
      normalizeEmailAddress(identity)
    );
    const defaultIdentityEmail = normalizeEmailAddress(domainEntry.defaultIdentityEmail);

    if (!normalizedAllowed.includes(defaultIdentityEmail)) {
      throw new Error("defaultIdentityEmail must exist in allowedIdentities");
    }

    for (const identity of normalizedAllowed) {
      if (!identity.endsWith(`@${domain}`)) {
        throw new Error(`identity ${identity} must belong to domain ${domain}`);
      }

      if (seenIdentities.has(identity)) {
        throw new Error(`identity ${identity} is declared more than once`);
      }

      seenIdentities.add(identity);
    }
  }

  return {
    ...config,
    defaults: {
      outboundProvider: config.defaults.outboundProvider
    },
    domains: config.domains.map((domainEntry) => ({
      ...domainEntry,
      domain: domainEntry.domain.toLowerCase(),
      outboundProvider: domainEntry.outboundProvider,
      defaultIdentityEmail: normalizeEmailAddress(domainEntry.defaultIdentityEmail),
      allowedIdentities: domainEntry.allowedIdentities.map(normalizeEmailAddress),
      displayNames: Object.fromEntries(
        Object.entries(domainEntry.displayNames as Record<string, string>).map(([key, value]) => [
          normalizeEmailAddress(key),
          value
        ])
      )
    }))
  };
}
