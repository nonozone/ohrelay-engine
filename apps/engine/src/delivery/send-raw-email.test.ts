import { describe, expect, it, vi } from "vitest";

import { sendRawEmail } from "./send-raw-email.js";

describe("sendRawEmail", () => {
  it("submits the rewritten raw message and records an outbound event", async () => {
    const send = vi.fn().mockResolvedValue({ MessageId: "ses-123" });
    const recordOutboundEvent = vi.fn().mockResolvedValue(undefined);

    const result = await sendRawEmail({
      client: { send },
      recordOutboundEvent,
      payload: {
        raw: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello",
        recipientEmail: "client@abc.com",
        decisionSource: "thread",
        identityUsed: "support@brand-a.com"
      }
    });

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith({
      Envelope: {
        From: "support@brand-a.com",
        To: ["client@abc.com"]
      },
      RawMessage: {
        Data: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello"
      }
    });
    expect(recordOutboundEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_email: "client@abc.com",
        decision_source: "thread",
        identity_used: "support@brand-a.com",
        result: "sent",
        provider_message_id: "ses-123",
        rejection_reason: null
      })
    );
    expect(result).toEqual({
      providerMessageId: "ses-123",
      traceId: expect.stringMatching(/^trace\.\d+\.client@abc\.com$/)
    });
  });

  it("attaches SES attribution tags when sending profile metadata is present", async () => {
    const send = vi.fn().mockResolvedValue({ MessageId: "ses-123" });
    const recordOutboundEvent = vi.fn().mockResolvedValue(undefined);

    await sendRawEmail({
      client: { send },
      recordOutboundEvent,
      payload: {
        raw: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello",
        recipientEmail: "client@abc.com",
        decisionSource: "thread",
        identityUsed: "support@brand-a.com",
        sendingProfile: {
          organizationId: "org-1",
          profileId: "profile-1"
        }
      }
    });

    expect(send).toHaveBeenCalledWith({
      Envelope: {
        From: "support@brand-a.com",
        To: ["client@abc.com"]
      },
      RawMessage: {
        Data: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello"
      },
      Tags: [
        { Name: "ohrelay-org-id", Value: "org-1" },
        { Name: "ohrelay-profile-id", Value: "profile-1" },
        {
          Name: "ohrelay-outbound-event-id",
          Value: expect.stringMatching(/^trace\.\d+\.client@abc\.com$/)
        }
      ]
    });
  });

  it("sanitizes trace ids so SES tag values only contain allowed characters", async () => {
    const send = vi.fn().mockResolvedValue({ MessageId: "ses-123" });
    const recordOutboundEvent = vi.fn().mockResolvedValue(undefined);

    const result = await sendRawEmail({
      client: { send },
      recordOutboundEvent,
      payload: {
        raw: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello",
        recipientEmail: "client+tag@abc.com",
        decisionSource: "thread",
        identityUsed: "support@brand-a.com",
        sendingProfile: {
          organizationId: "org-1",
          profileId: "profile-1"
        }
      }
    });

    expect(result.traceId).toMatch(/^trace\.\d+\.client-tag@abc\.com$/);
    expect(send.mock.calls[0]?.[0]?.Tags).toEqual(
      expect.arrayContaining([
        {
          Name: "ohrelay-outbound-event-id",
          Value: expect.stringMatching(/^trace\.\d+\.client-tag@abc\.com$/)
        }
      ])
    );
    expect(recordOutboundEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        trace_id: expect.stringMatching(/^trace\.\d+\.client-tag@abc\.com$/)
      })
    );
  });
});
