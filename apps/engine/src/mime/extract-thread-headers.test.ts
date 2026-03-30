import { describe, expect, it } from "vitest";

import { extractThreadHeaders } from "./extract-thread-headers.js";

describe("extractThreadHeaders", () => {
  it("extracts standard In-Reply-To and References", () => {
    const raw = [
      "From: sender@example.com",
      "To: recipient@example.com",
      "In-Reply-To: <thread-1@example.com>",
      "References: <ref-1@example.com> <ref-2@example.com>",
      "",
      "hello"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBe("<thread-1@example.com>");
    expect(result.references).toEqual([
      "<ref-1@example.com>",
      "<ref-2@example.com>"
    ]);
  });

  it("handles folded In-Reply-To across multiple lines", () => {
    const raw = [
      "From: sender@example.com",
      "In-Reply-To:",
      " <folded-id@example.com>",
      "To: recipient@example.com",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBe("<folded-id@example.com>");
  });

  it("returns null inReplyTo when only References is present", () => {
    const raw = [
      "From: sender@example.com",
      "References: <ref-1@example.com>",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBeNull();
    expect(result.references).toEqual(["<ref-1@example.com>"]);
  });

  it("returns empty references when only In-Reply-To is present", () => {
    const raw = [
      "From: sender@example.com",
      "In-Reply-To: <only-reply@example.com>",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBe("<only-reply@example.com>");
    expect(result.references).toEqual([]);
  });

  it("returns null and empty array when neither header is present", () => {
    const raw = [
      "From: sender@example.com",
      "To: recipient@example.com",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBeNull();
    expect(result.references).toEqual([]);
  });

  it("splits a long multi-id References chain", () => {
    const ids = Array.from({ length: 5 }, (_, index) => `<ref-${index}@example.com>`);
    const raw = [
      "From: sender@example.com",
      `References: ${ids.join(" ")}`,
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.references).toEqual(ids);
  });

  it("handles folded References across continuation lines", () => {
    const raw = [
      "From: sender@example.com",
      "References: <ref-1@example.com>",
      " <ref-2@example.com>",
      "\t<ref-3@example.com>",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.references).toEqual([
      "<ref-1@example.com>",
      "<ref-2@example.com>",
      "<ref-3@example.com>"
    ]);
  });

  it("works when input has no header/body separator", () => {
    const raw = [
      "From: sender@example.com",
      "In-Reply-To: <no-sep@example.com>"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBe("<no-sep@example.com>");
  });

  it("normalizes bare message ids into angle-bracket form", () => {
    const raw = [
      "From: sender@example.com",
      "In-Reply-To: bare-id@example.com",
      "References: bare-ref@example.com",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.inReplyTo).toBe("<bare-id@example.com>");
    expect(result.references).toEqual(["<bare-ref@example.com>"]);
  });

  it("filters out empty or whitespace-only reference segments", () => {
    const raw = [
      "From: sender@example.com",
      "References:  <valid@example.com>   ",
      "",
      "body"
    ].join("\r\n");

    const result = extractThreadHeaders(raw);

    expect(result.references).toEqual(["<valid@example.com>"]);
  });
});
