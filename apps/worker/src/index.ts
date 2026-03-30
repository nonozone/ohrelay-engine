import { normalizeEmailAddress, normalizeMessageId } from "@ohrelay/shared";

import { createIngestClient, type WorkerEnv } from "./ingest/create-ingest-client.js";
import { sniffVerificationCode } from "./verification-sniffer.js";

export type WorkerMessage = {
  from: string;
  to: string;
  headers: {
    get(name: string): string | null;
  };
  forward(target: string): Promise<void>;
  setReject(reason: string): void;
};

export type WorkerContext = {
  waitUntil(promise: Promise<unknown>): void;
};

export async function emailHandler(message: WorkerMessage, env: WorkerEnv, ctx: WorkerContext): Promise<void> {
  const metadata = extractMetadata(message);
  const ingestClient = createIngestClient(env);

  try {
    const resolution = await ingestClient.resolveInbound({
      identity_email: metadata.to
    });

    if (resolution.action === "reject") {
      message.setReject("550 5.1.1 User unknown");
      return;
    }

    await message.forward(resolution.target);
    ctx.waitUntil(processAfterForward(metadata, env, resolution.target));
  } catch {
    message.setReject("451 4.3.0 Temporary server failure");
  }
}

export function buildThreadPayload(metadata: WorkerMetadata) {
  return {
    message_id: normalizeMessageId(metadata.messageId),
    contact_email: normalizeEmailAddress(metadata.from),
    identity_email: normalizeEmailAddress(metadata.to),
    domain: normalizeEmailAddress(metadata.to).split("@")[1] ?? "",
    references_raw: metadata.references
  };
}

export default {
  email: emailHandler
};

type WorkerMetadata = {
  from: string;
  to: string;
  messageId: string | null;
  subject: string | null;
  references: string | null;
};

function extractMetadata(message: WorkerMessage): WorkerMetadata {
  return {
    from: message.from,
    to: message.to,
    messageId: message.headers.get("message-id"),
    subject: message.headers.get("subject"),
    references: message.headers.get("references")
  };
}

async function processAfterForward(metadata: WorkerMetadata, env: WorkerEnv, forwardTarget: string): Promise<void> {
  const ingestClient = createIngestClient(env);
  const threadPayload = buildThreadPayload(metadata);
  const statePayload = {
    contact_email: threadPayload.contact_email,
    identity_email: threadPayload.identity_email,
    domain: threadPayload.domain,
    last_message_id: threadPayload.message_id
  };
  const inboundEventPayload = {
    contact_email: threadPayload.contact_email,
    rcpt_to: threadPayload.identity_email,
    message_id: threadPayload.message_id,
    forward_target: forwardTarget,
    mapping_status: "recorded",
    error_reason: null
  };

  await Promise.all([
    ingestClient.recordInbound({
      thread: threadPayload,
      state: statePayload,
      inboundEvent: inboundEventPayload
    }),
    maybeRecordVerificationCode(metadata, ingestClient, threadPayload.identity_email)
  ]);
}

async function maybeRecordVerificationCode(
  metadata: WorkerMetadata,
  ingestClient: ReturnType<typeof createIngestClient>,
  identityEmail: string
): Promise<void> {
  const sourceEmail = normalizeEmailAddress(metadata.from);
  const signalText = metadata.subject ?? "";
  const code = sniffVerificationCode(signalText);

  if (!code) {
    return;
  }

  await ingestClient.recordVerificationCode({
    source_email: sourceEmail,
    identity_email: identityEmail,
    code,
    provider_hint: sourceEmail.split("@")[1] ?? null,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });
}
