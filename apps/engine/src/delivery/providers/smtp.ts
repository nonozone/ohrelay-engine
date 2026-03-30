import { createRequire } from "node:module";

import type { RawEmailClient } from "../send-raw-email.js";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
};

type TransportFactory = {
  createTransport?(options: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }): {
    sendMail(input: {
      envelope: {
        from: string;
        to: string[];
      };
      raw: string;
    }): Promise<{ messageId?: string }>;
  };
};

const require = createRequire(import.meta.url);
const nodemailer = require("nodemailer") as {
  createTransport(options: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }): {
    sendMail(input: {
      envelope: {
        from: string;
        to: string[];
      };
      raw: string;
    }): Promise<{ messageId?: string }>;
  };
};

export function createSmtpClient(
  config: SmtpConfig,
  transportFactory: TransportFactory = {}
): RawEmailClient {
  const createTransport =
    transportFactory.createTransport ?? nodemailer.createTransport;
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password
    }
  });

  return {
    async send({ Envelope, RawMessage }) {
      const response = await transport.sendMail({
        envelope: {
          from: Envelope.From,
          to: Envelope.To
        },
        raw: RawMessage.Data
      });

      return { MessageId: response.messageId };
    }
  };
}
