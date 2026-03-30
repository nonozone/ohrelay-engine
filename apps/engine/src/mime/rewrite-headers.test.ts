import { describe, expect, it } from "vitest";

import { rewriteHeaders } from "./rewrite-headers.js";

describe("rewriteHeaders", () => {
  it("rewrites from and sender without touching the MIME body", () => {
    const raw = [
      "From: Me <me@gmail.com>",
      "Sender: Me <me@gmail.com>",
      "To: client@abc.com",
      "",
      "hello"
    ].join("\r\n");

    const result = rewriteHeaders(raw, {
      identityEmail: "support@brand-a.com",
      displayName: "Brand A Support"
    });

    expect(result.raw).toContain("From: Brand A Support <support@brand-a.com>");
    expect(result.raw).toContain("Sender: support@brand-a.com");
    expect(result.raw.endsWith("\r\n\r\nhello")).toBe(true);
  });

  it("rejects malformed messages with no header boundary", () => {
    expect(() =>
      rewriteHeaders("broken", {
        identityEmail: "support@brand-a.com",
        displayName: "Brand A Support"
      })
    ).toThrow(/header boundary/i);
  });

  it("removes any existing dkim-signature header before SES submission", () => {
    const raw = [
      "DKIM-Signature: v=1; a=rsa-sha256; d=old.example;",
      "From: Me <me@gmail.com>",
      "To: client@abc.com",
      "",
      "hello"
    ].join("\r\n");

    const result = rewriteHeaders(raw, {
      identityEmail: "support@brand-a.com",
      displayName: "Brand A Support"
    });

    expect(result.raw).not.toContain("DKIM-Signature:");
  });

  it("rewrites reply-to only when it points at the operator private mailbox", () => {
    const raw = [
      "From: Me <me@gmail.com>",
      "Reply-To: me@gmail.com",
      "To: client@abc.com",
      "",
      "hello"
    ].join("\r\n");

    const result = rewriteHeaders(raw, {
      identityEmail: "support@brand-a.com",
      displayName: "Brand A Support",
      operatorPrivateEmail: "me@gmail.com"
    });

    expect(result.raw).toContain("Reply-To: support@brand-a.com");
  });

  it("replaces message-id and removes known google transport fingerprint headers", () => {
    const raw = [
      "Message-ID: <old@mail.gmail.com>",
      "X-Google-DKIM-Signature: abc123",
      "X-Gm-Message-State: state123",
      "X-Google-SMTP-Source: source123",
      "From: Me <me@gmail.com>",
      "To: client@abc.com",
      "",
      "hello"
    ].join("\r\n");

    const result = rewriteHeaders(raw, {
      identityEmail: "support@brand-a.com",
      displayName: "Brand A Support",
      generateMessageId: () => "<reply-123@brand-a.com>"
    });

    expect(result.raw).toContain("Message-ID: <reply-123@brand-a.com>");
    expect(result.raw).not.toContain("Message-ID: <old@mail.gmail.com>");
    expect(result.raw).not.toContain("X-Google-DKIM-Signature:");
    expect(result.raw).not.toContain("X-Gm-Message-State:");
    expect(result.raw).not.toContain("X-Google-SMTP-Source:");
    expect(result.messageId).toBe("<reply-123@brand-a.com>");
  });

  it("exposes the generated messageId alongside the rewritten raw", () => {
    const raw = [
      "From: Me <me@gmail.com>",
      "To: client@abc.com",
      "",
      "hello"
    ].join("\r\n");

    const result = rewriteHeaders(raw, {
      identityEmail: "support@brand-a.com",
      displayName: "Brand A Support",
      generateMessageId: () => "<test-id-42@brand-a.com>"
    });

    expect(result.messageId).toBe("<test-id-42@brand-a.com>");
    expect(result.raw).toContain("Message-ID: <test-id-42@brand-a.com>");
    expect(typeof result.raw).toBe("string");
  });

  it("mime-encodes non-ascii gmail-style headers before outbound delivery", () => {
    const raw = [
      "MIME-Version: 1.0",
      "Subject: QQ测试第五次",
      "From: ohrelay <or8l8gwd@send.ohrelay.com>",
      "To: \"no总\" <penhub@qq.com>",
      "",
      "hello"
    ].join("\r\n");

    const result = rewriteHeaders(raw, {
      identityEmail: "support@brand-a.com",
      displayName: "Brand A Support",
      generateMessageId: () => "<gmail-web-1@brand-a.com>"
    });

    expect(result.raw).toContain("Subject: =?UTF-8?");
    expect(result.raw).toContain("To: =?UTF-8?");
    expect(result.raw).not.toContain("Subject: QQ测试第五次");
    expect(result.raw).not.toContain("To: \"no总\" <penhub@qq.com>");
  });
});
