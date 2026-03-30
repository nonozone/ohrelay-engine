import { describe, expect, it, vi } from "vitest";

import { createResendSmtpClient } from "./resend-smtp.js";

describe("createResendSmtpClient", () => {
  it("sends raw messages through Resend SMTP with the expected relay settings", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "resend-123" });
    const createTransport = vi.fn().mockReturnValue({ sendMail });

    const client = createResendSmtpClient(
      {
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        username: "resend",
        password: "re_test_key"
      },
      { createTransport }
    );

    const result = await client.send({
      Envelope: {
        From: "support@brand-a.com",
        To: ["client@abc.com"]
      },
      RawMessage: {
        Data: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello"
      }
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: "re_test_key"
      }
    });
    expect(sendMail).toHaveBeenCalledWith({
      envelope: {
        from: "support@brand-a.com",
        to: ["client@abc.com"]
      },
      raw: "From: Brand A Support <support@brand-a.com>\r\n\r\nhello"
    });
    expect(result).toEqual({ MessageId: "resend-123" });
  });
});
