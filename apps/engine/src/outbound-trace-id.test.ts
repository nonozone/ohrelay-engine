import { describe, expect, it } from "vitest";

import { createOutboundTraceId } from "./outbound-trace-id.js";

describe("createOutboundTraceId", () => {
  it("keeps SES-safe characters only", () => {
    expect(createOutboundTraceId("client+tag@abc.com", 123)).toBe(
      "trace.123.client-tag@abc.com"
    );
  });

  it("falls back to unknown when the recipient becomes empty", () => {
    expect(createOutboundTraceId("   ", 123)).toBe("trace.123.unknown");
  });
});
