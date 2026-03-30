const TRACE_ID_ALLOWED_CHARS = /[^A-Za-z0-9_.@-]+/g;
const MULTIPLE_DASHES = /-{2,}/g;

export function createOutboundTraceId(
  recipientEmail: string,
  now: number = Date.now()
): string {
  const normalizedRecipient = recipientEmail.trim().toLowerCase();
  const safeRecipient = normalizedRecipient
    .replace(TRACE_ID_ALLOWED_CHARS, "-")
    .replace(MULTIPLE_DASHES, "-")
    .replace(/^[.-]+|[.-]+$/g, "");

  return `trace.${now}.${safeRecipient || "unknown"}`;
}
