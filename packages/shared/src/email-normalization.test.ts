import { describe, expect, it } from "vitest";

import { normalizeMessageId } from "./email-normalization.js";

describe("normalizeMessageId", () => {
  it("normalizes message ids with angle brackets", () => {
    expect(normalizeMessageId(" abc123@example.com ")).toBe("<abc123@example.com>");
  });
});
