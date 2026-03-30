import { describe, expect, it } from "vitest";

import { rewriteBootstrapMessage } from "./rewrite-bootstrap-message.js";

describe("rewriteBootstrapMessage", () => {
  it("rewrites To and From while stripping thread headers and generating a Message-ID", () => {
    const raw = `From: Operator <operator@gmail.com>\r
To: Temporary Token <mail+abc123@send.ohrelay.com>\r
Subject: First Outreach\r
In-Reply-To: <old-msg@gmail.com>\r
References: <old-msg@gmail.com>\r
Message-ID: <local-msg@gmail.com>\r
DKIM-Signature: a=rsa-sha256; ...\r
Content-Type: text/plain\r
Date: Sun, 29 Mar 2026 10:00:00 +0000\r
\r
Hello there!`;

    const result = rewriteBootstrapMessage(raw, {
      identityEmail: "hello@brand.com",
      displayName: "Brand Representative",
      targetRecipientEmail: "investor@vc.com",
      generateMessageId: () => "<new-id@brand.com>"
    });

    expect(result.messageId).toBe("<new-id@brand.com>");

    const lines = result.raw.split("\r\n");
    expect(lines).toContain("From: Brand Representative <hello@brand.com>");
    expect(lines).toContain("Sender: hello@brand.com");
    expect(lines).toContain("To: investor@vc.com");
    expect(lines).toContain("Message-ID: <new-id@brand.com>");

    const lowerRaw = result.raw.toLowerCase();
    expect(lowerRaw).not.toContain("in-reply-to");
    expect(lowerRaw).not.toContain("references");
    expect(lowerRaw).not.toContain("dkim-signature");
    expect(lowerRaw).not.toContain("mail+abc123@send.ohrelay.com");

    expect(result.raw).toContain("\r\n\r\nHello there!");
  });
});
