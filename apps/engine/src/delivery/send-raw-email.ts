import { createOutboundTraceId } from "../outbound-trace-id.js";

export type RawEmailClient = {
  send(input: {
    Envelope: { From: string; To: string[] };
    RawMessage: { Data: string };
    Tags?: Array<{ Name: string; Value: string }>;
  }): Promise<{ MessageId?: string }>;
};

export type OutboundEventRecorder = (payload: {
  trace_id?: string;
  recipient_email: string;
  decision_source: "thread" | "state" | "bootstrap" | "none";
  identity_used: string | null;
  result: "sent" | "rejected";
  rejection_reason: string | null;
  provider_message_id: string | null;
}) => Promise<void>;

export type SendRawEmailInput = {
  client: RawEmailClient;
  recordOutboundEvent: OutboundEventRecorder;
  payload: {
    raw: string;
    recipientEmail: string;
    decisionSource: "thread" | "state" | "bootstrap";
    identityUsed: string;
    sendingProfile?: {
      organizationId: string;
      profileId: string;
    };
  };
};

export async function sendRawEmail(
  input: SendRawEmailInput
): Promise<{ providerMessageId: string | null; traceId: string }> {
  const traceId = createOutboundTraceId(input.payload.recipientEmail);
  const response = await input.client.send({
    Envelope: {
      From: input.payload.identityUsed,
      To: [input.payload.recipientEmail]
    },
    RawMessage: {
      Data: input.payload.raw
    },
    Tags: input.payload.sendingProfile
      ? [
          {
            Name: "ohrelay-org-id",
            Value: input.payload.sendingProfile.organizationId
          },
          {
            Name: "ohrelay-profile-id",
            Value: input.payload.sendingProfile.profileId
          },
          { Name: "ohrelay-outbound-event-id", Value: traceId }
        ]
      : undefined
  });

  const providerMessageId = response.MessageId ?? null;

  await input.recordOutboundEvent({
    trace_id: traceId,
    recipient_email: input.payload.recipientEmail,
    decision_source: input.payload.decisionSource,
    identity_used: input.payload.identityUsed,
    result: "sent",
    rejection_reason: null,
    provider_message_id: providerMessageId
  });

  return { providerMessageId, traceId };
}
