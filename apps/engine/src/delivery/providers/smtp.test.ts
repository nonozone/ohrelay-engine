import { describe, expect, it, vi } from "vitest";

import { createSmtpClient } from "./smtp.js";

describe("createSmtpClient", () => {
  it("sends raw messages through a generic SMTP relay with the configured credentials", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "smtp-123" });
    const createTransport = vi.fn().mockReturnValue({ sendMail });

    const client = createSmtpClient(
      {
        host: "smtp.zeptomail.com",
        port: 465,
        secure: true,
        username: "zepto-user",
        password: "zepto-pass"
      },
      { createTransport }
    );

    const result = await client.send({
      Envelope: {
        From: "noreply@ohrelay.com",
        To: ["owner@example.com"]
      },
      RawMessage: {
        Data: "From: OhRelay <noreply@ohrelay.com>\r\n\r\nhello"
      }
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.zeptomail.com",
      port: 465,
      secure: true,
      auth: {
        user: "zepto-user",
        pass: "zepto-pass"
      }
    });
    expect(sendMail).toHaveBeenCalledWith({
      envelope: {
        from: "noreply@ohrelay.com",
        to: ["owner@example.com"]
      },
      raw: "From: OhRelay <noreply@ohrelay.com>\r\n\r\nhello"
    });
    expect(result).toEqual({ MessageId: "smtp-123" });
  });
});
