import { afterEach, describe, expect, it, vi } from "vitest";

import { buildThreadPayload, emailHandler } from "./index.js";

describe("worker email handler", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards before async persistence work", async () => {
    const forward = vi.fn().mockResolvedValue(undefined);
    const setReject = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: "forward",
          target: "owner@example.com",
          identity_email: "support@brand-a.com",
          route_id: "route-1"
        })
      })
      .mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const pending: Promise<unknown>[] = [];
    const waitUntil = vi.fn((promise: Promise<unknown>) => {
      pending.push(promise);
    });

    await emailHandler(
      fakeMessage({ forward, setReject }),
      {
        FORWARD_TARGET_EMAIL: "me@example.com",
        INGEST_PROVIDER: "core-http",
        CORE_INGEST_BASE_URL: "https://api.ohrelay.com",
        CORE_INGEST_TOKEN: "secret"
      },
      { waitUntil }
    );

    await Promise.all(pending);

    expect(forward).toHaveBeenCalledOnce();
    expect(forward).toHaveBeenCalledWith("owner@example.com");
    expect(setReject).not.toHaveBeenCalled();
    expect(waitUntil).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.ohrelay.com/internal/routing/resolve-inbound");
  });

  it("rejects unmapped identities without ingesting", async () => {
    const forward = vi.fn().mockResolvedValue(undefined);
    const setReject = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: "reject",
        reason: "unknown_identity"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const waitUntil = vi.fn();

    await emailHandler(
      fakeMessage({ forward, setReject }),
      {
        FORWARD_TARGET_EMAIL: "me@example.com",
        INGEST_PROVIDER: "core-http",
        CORE_INGEST_BASE_URL: "https://api.ohrelay.com",
        CORE_INGEST_TOKEN: "secret"
      },
      { waitUntil }
    );

    expect(forward).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
    expect(setReject).toHaveBeenCalledWith("550 5.1.1 User unknown");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects with a temporary error when route resolution fails", async () => {
    const forward = vi.fn().mockResolvedValue(undefined);
    const setReject = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);

    await emailHandler(
      fakeMessage({ forward, setReject }),
      {
        FORWARD_TARGET_EMAIL: "me@example.com",
        INGEST_PROVIDER: "core-http",
        CORE_INGEST_BASE_URL: "https://api.ohrelay.com",
        CORE_INGEST_TOKEN: "secret"
      },
      { waitUntil: vi.fn() }
    );

    expect(forward).not.toHaveBeenCalled();
    expect(setReject).toHaveBeenCalledWith("451 4.3.0 Temporary server failure");
  });

  it("normalizes and stores the exact rcpt identity", () => {
    expect(
      buildThreadPayload({
        from: "Client@ABC.com",
        to: "Support@brand-a.com",
        messageId: "abc@example.com",
        subject: "Hello",
        references: null
      })
    ).toMatchObject({
      contact_email: "client@abc.com",
      identity_email: "support@brand-a.com",
      message_id: "<abc@example.com>"
    });
  });
});

function fakeMessage({
  forward,
  setReject = () => undefined
}: {
  forward: () => Promise<void>;
  setReject?: (reason: string) => void;
}) {
  const headers = new Map<string, string>([
    ["message-id", "abc@example.com"],
    ["subject", "Hello"]
  ]);

  return {
    from: "Client@ABC.com",
    to: "Support@brand-a.com",
    headers: {
      get(name: string) {
        return headers.get(name.toLowerCase()) ?? null;
      }
    },
    forward,
    setReject
  };
}
