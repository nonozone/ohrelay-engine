import type { RawEmailClient } from "./send-raw-email.js";
import { createResendSmtpClient } from "./providers/resend-smtp.js";
import { createSmtpClient } from "./providers/smtp.js";
import { createSesClient, sendSesRawMessage } from "./ses-client.js";

export type DeliveryProvider = "mock" | "resend-smtp" | "smtp" | "ses";
export type RawEmailClientMap = Record<DeliveryProvider, RawEmailClient | null>;

export type DeliveryRuntimeEnv = {
  awsRegion: string | null;
  sesConfigurationSetName?: string | null;
  smtpHost?: string | null;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  resendSmtpHost: string;
  resendSmtpPort: number;
  resendSmtpSecure: boolean;
  resendSmtpUsername: string;
  resendSmtpPassword: string | null;
};

export function createRawEmailClients(
  runtimeEnv: DeliveryRuntimeEnv,
  providers: Iterable<DeliveryProvider>
): RawEmailClientMap {
  const uniqueProviders = new Set(providers);
  const clients = {
    mock: createMockClient(),
    "resend-smtp": null,
    smtp: null,
    ses: null
  } as RawEmailClientMap;

  for (const provider of uniqueProviders) {
    if (provider === "mock") {
      continue;
    }

    if (provider === "resend-smtp") {
      if (!runtimeEnv.resendSmtpPassword) {
        throw new Error(
          "RESEND_API_KEY is required when a domain uses resend-smtp"
        );
      }

      clients["resend-smtp"] = createResendSmtpClient({
        host: runtimeEnv.resendSmtpHost,
        port: runtimeEnv.resendSmtpPort,
        secure: runtimeEnv.resendSmtpSecure,
        username: runtimeEnv.resendSmtpUsername,
        password: runtimeEnv.resendSmtpPassword
      });
      continue;
    }

    if (provider === "smtp") {
      if (
        !runtimeEnv.smtpHost ||
        !runtimeEnv.smtpUsername ||
        !runtimeEnv.smtpPassword
      ) {
        throw new Error(
          "AUTH_SMTP_HOST, AUTH_SMTP_USERNAME, and AUTH_SMTP_PASSWORD are required when AUTH_DELIVERY_PROVIDER=smtp"
        );
      }

      clients.smtp = createSmtpClient({
        host: runtimeEnv.smtpHost,
        port: runtimeEnv.smtpPort ?? 465,
        secure: runtimeEnv.smtpSecure ?? true,
        username: runtimeEnv.smtpUsername,
        password: runtimeEnv.smtpPassword
      });
      continue;
    }

    if (!runtimeEnv.awsRegion) {
      throw new Error("AWS_REGION is required when a domain uses ses");
    }

    const client = createSesClient(runtimeEnv.awsRegion);
    clients.ses = {
      send: async ({ RawMessage, Tags }) =>
        sendSesRawMessage(
          client,
          RawMessage.Data,
          runtimeEnv.sesConfigurationSetName ?? undefined,
          Tags
        )
    };
  }

  return clients;
}

function createMockClient(): RawEmailClient {
  return {
    send: async () => ({ MessageId: "local-dev" })
  };
}
