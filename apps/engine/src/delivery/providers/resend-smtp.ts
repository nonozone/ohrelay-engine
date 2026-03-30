import type { RawEmailClient } from "../send-raw-email.js";
import { createSmtpClient } from "./smtp.js";

export type ResendSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
 username: string;
  password: string;
};

type TransportFactory = Parameters<typeof createSmtpClient>[1];

export function createResendSmtpClient(
  config: ResendSmtpConfig,
  transportFactory: TransportFactory = {}
): RawEmailClient {
  return createSmtpClient(config, transportFactory);
}
