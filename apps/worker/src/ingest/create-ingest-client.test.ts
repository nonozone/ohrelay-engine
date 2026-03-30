import { describe, expect, it, vi } from "vitest";

import { createIngestClient } from "./create-ingest-client.js";

describe("createIngestClient", () => {
  it("uses Supabase REST writes by default", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    const client = createIngestClient(
      {
        FORWARD_TARGET_EMAIL: "me@example.com",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_KEY: "secret"
      },
      { fetch: fetchMock }
    );

    await client.recordInbound({
      thread: {
        message_id: "<thread-1@example.com>",
        contact_email: "client@example.com",
        identity_email: "support@example.com",
        domain: "example.com",
        references_raw: null
      },
      state: {
        contact_email: "client@example.com",
        identity_email: "support@example.com",
        domain: "example.com",
        last_message_id: "<thread-1@example.com>"
      },
      inboundEvent: {
        contact_email: "client@example.com",
        rcpt_to: "support@example.com",
        message_id: "<thread-1@example.com>",
        forward_target: "me@example.com",
        mapping_status: "recorded",
        error_reason: null
      }
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "https://example.supabase.co/rest/v1/thread_context",
      "https://example.supabase.co/rest/v1/contact_identity_state",
      "https://example.supabase.co/rest/v1/inbound_events"
    ]);
  });

  it("can switch to a core http ingest endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    const client = createIngestClient(
      {
        FORWARD_TARGET_EMAIL: "me@example.com",
        INGEST_PROVIDER: "core-http",
        CORE_INGEST_BASE_URL: "https://api.ohrelay.com",
        CORE_INGEST_TOKEN: "token"
      },
      { fetch: fetchMock }
    );

    await client.recordInbound({
      thread: {
        message_id: "<thread-1@example.com>",
        contact_email: "client@example.com",
        identity_email: "support@example.com",
        domain: "example.com",
        references_raw: null
      },
      state: {
        contact_email: "client@example.com",
        identity_email: "support@example.com",
        domain: "example.com",
        last_message_id: "<thread-1@example.com>"
      },
      inboundEvent: {
        contact_email: "client@example.com",
        rcpt_to: "support@example.com",
        message_id: "<thread-1@example.com>",
        forward_target: "me@example.com",
        mapping_status: "recorded",
        error_reason: null
      }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.ohrelay.com/internal/ingest/inbound",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer token"
        })
      })
    );
  });

  it("resolves inbound routes through the core http endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: "forward",
        target: "owner@example.com",
        identity_email: "support@example.com",
        route_id: "route-1"
      })
    });
    const client = createIngestClient(
      {
        FORWARD_TARGET_EMAIL: "me@example.com",
        INGEST_PROVIDER: "core-http",
        CORE_INGEST_BASE_URL: "https://api.ohrelay.com",
        CORE_INGEST_TOKEN: "token"
      },
      { fetch: fetchMock }
    );

    const result = await client.resolveInbound({
      identity_email: "support@example.com"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.ohrelay.com/internal/routing/resolve-inbound",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer token"
        }),
        body: JSON.stringify({
          identity_email: "support@example.com"
        })
      })
    );
    expect(result).toEqual({
      action: "forward",
      target: "owner@example.com",
      identity_email: "support@example.com",
      route_id: "route-1"
    });
  });
});
