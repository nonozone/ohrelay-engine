import { afterEach, describe, expect, it, vi } from "vitest";

import {
  decryptSmtpPassword,
  encryptSmtpPassword
} from "./smtp-password-crypto.js";

describe("smtp password crypto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a password with a configured master key", () => {
    vi.stubEnv(
      "SMTP_CREDENTIALS_MASTER_KEY",
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    );

    const ciphertext = encryptSmtpPassword("A8JJGSAG");

    expect(ciphertext.startsWith("v1:")).toBe(true);
    expect(decryptSmtpPassword(ciphertext)).toBe("A8JJGSAG");
  });

  it("throws in production when the master key is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMTP_CREDENTIALS_MASTER_KEY", "");

    expect(() => encryptSmtpPassword("A8JJGSAG")).toThrow(
      /SMTP_CREDENTIALS_MASTER_KEY is required in production/
    );
  });
});
