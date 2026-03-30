import { describe, expect, it, vi } from "vitest";

import { sendSesRawMessage } from "./ses-client.js";

describe("sendSesRawMessage", () => {
  it("passes the optional configuration set name into SES", async () => {
    const send = vi.fn().mockResolvedValue({ MessageId: "ses-123" });

    const result = await sendSesRawMessage(
      { send } as never,
      "raw-message",
      "ohrelay-default"
    );

    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[0]?.input).toMatchObject({
      ConfigurationSetName: "ohrelay-default"
    });
    expect(result).toEqual({ MessageId: "ses-123" });
  });

  it("passes SES message tags into the raw email command", async () => {
    const send = vi.fn().mockResolvedValue({ MessageId: "ses-123" });

    await sendSesRawMessage({ send } as never, "raw-message", "ohrelay-default", [
      { Name: "ohrelay-org-id", Value: "org-1" },
      { Name: "ohrelay-profile-id", Value: "profile-1" }
    ]);

    expect(send.mock.calls[0]?.[0]?.input).toMatchObject({
      ConfigurationSetName: "ohrelay-default",
      Tags: [
        { Name: "ohrelay-org-id", Value: "org-1" },
        { Name: "ohrelay-profile-id", Value: "profile-1" }
      ]
    });
  });
});
