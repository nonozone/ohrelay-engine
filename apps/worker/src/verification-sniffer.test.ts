import { describe, expect, it } from "vitest";

import { sniffVerificationCode } from "./verification-sniffer.js";

describe("sniffVerificationCode", () => {
  it("extracts a 6-9 digit code from subject-like text", () => {
    expect(sniffVerificationCode("Your verification code is 123456")).toBe("123456");
  });
});
