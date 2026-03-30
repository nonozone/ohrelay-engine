import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const addressParser = require("nodemailer/lib/addressparser") as (
  value: string
) => ParsedAddress[];
const mimeFuncs = require("nodemailer/lib/mime-funcs") as {
  encodeWords(
    value: string,
    mimeWordEncoding?: "B" | "Q",
    maxLength?: number
  ): string;
};

export type RewriteHeadersInput = {
  identityEmail: string;
  displayName: string;
  operatorPrivateEmail?: string;
  generateMessageId?: () => string;
};

type HeaderEntry = {
  name: string;
  value: string;
};

type ParsedAddress = {
  address?: string;
  group?: ParsedAddress[];
  name?: string;
};

export type RewriteHeadersResult = {
  raw: string;
  messageId: string;
};

const ADDRESS_HEADERS = new Set([
  "from",
  "to",
  "cc",
  "bcc",
  "reply-to",
  "sender"
]);
const MIME_WORD_HEADERS = new Set(["subject"]);

export function rewriteHeaders(
  raw: string,
  input: RewriteHeadersInput
): RewriteHeadersResult {
  const boundaryIndex = raw.indexOf("\r\n\r\n");

  if (boundaryIndex < 0) {
    throw new Error("Missing header boundary");
  }

  const headerSection = raw.slice(0, boundaryIndex);
  const bodySection = raw.slice(boundaryIndex + 4);
  const headers = parseHeaders(headerSection).filter((header) => {
    const name = header.name.toLowerCase();
    return ![
      "dkim-signature",
      "x-google-dkim-signature",
      "x-gm-message-state",
      "x-google-smtp-source"
    ].includes(name);
  });

  let hasFrom = false;
  let hasSender = false;
  let hasReplyTo = false;
  let hasMessageId = false;
  const generatedMessageId =
    input.generateMessageId?.() ?? buildMessageId(input.identityEmail);

  const rewritten = headers.map((header) => {
    const name = header.name.toLowerCase();

    if (name === "from") {
      hasFrom = true;
      return {
        name: header.name,
        value: `${input.displayName} <${input.identityEmail}>`
      };
    }

    if (name === "sender") {
      hasSender = true;
      return {
        name: header.name,
        value: input.identityEmail
      };
    }

    if (name === "reply-to") {
      hasReplyTo = true;
      if (
        input.operatorPrivateEmail &&
        matchesMailbox(header.value, input.operatorPrivateEmail)
      ) {
        return {
          name: header.name,
          value: input.identityEmail
        };
      }
    }

    if (name === "message-id") {
      hasMessageId = true;
      return {
        name: header.name,
        value: generatedMessageId
      };
    }

    return header;
  });

  if (!hasFrom) {
    rewritten.unshift({
      name: "From",
      value: `${input.displayName} <${input.identityEmail}>`
    });
  }

  if (!hasSender) {
    rewritten.push({
      name: "Sender",
      value: input.identityEmail
    });
  }

  if (!hasMessageId) {
    rewritten.push({
      name: "Message-ID",
      value: generatedMessageId
    });
  }

  if (!hasReplyTo && input.operatorPrivateEmail) {
    // Do not add Reply-To automatically in MVP. Only rewrite an existing private one.
  }

  const serializedHeaders = rewritten
    .map(
      (header) =>
        `${header.name}: ${canonicalizeHeaderValue(header.name, header.value)}`
    )
    .join("\r\n");

  return {
    raw: `${serializedHeaders}\r\n\r\n${bodySection}`,
    messageId: generatedMessageId
  };
}

function parseHeaders(headerSection: string): HeaderEntry[] {
  const lines = headerSection.split("\r\n");
  const entries: HeaderEntry[] = [];

  for (const line of lines) {
    if (/^[ \t]/.test(line) && entries.length > 0) {
      entries[entries.length - 1]!.value += `\r\n${line}`;
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }

    entries.push({
      name: line.slice(0, separatorIndex),
      value: line.slice(separatorIndex + 1).trim()
    });
  }

  return entries;
}

function matchesMailbox(value: string, mailbox: string): boolean {
  const normalizedMailbox = mailbox.trim().toLowerCase();
  return value.toLowerCase().includes(normalizedMailbox);
}

function canonicalizeHeaderValue(name: string, value: string): string {
  const unfoldedValue = unfoldHeaderValue(value);
  const lowerName = name.toLowerCase();

  if (ADDRESS_HEADERS.has(lowerName)) {
    return canonicalizeAddressHeader(unfoldedValue);
  }

  if (MIME_WORD_HEADERS.has(lowerName) && containsNonAscii(unfoldedValue)) {
    return mimeFuncs.encodeWords(unfoldedValue, "Q", 52);
  }

  return unfoldedValue;
}

function canonicalizeAddressHeader(value: string): string {
  if (!containsNonAscii(value)) {
    return value;
  }

  const parsed = addressParser(value);

  if (parsed.length === 0) {
    return mimeFuncs.encodeWords(value, "Q", 52);
  }

  return parsed
    .map((entry) => formatAddressEntry(entry))
    .filter((entry): entry is string => entry.length > 0)
    .join(", ");
}

function formatAddressEntry(entry: ParsedAddress): string {
  if (entry.group && entry.group.length > 0) {
    const groupLabel = formatDisplayName(entry.name ?? "");
    const members = entry.group
      .map((member) => formatAddressEntry(member))
      .filter((member): member is string => member.length > 0)
      .join(", ");

    return `${groupLabel}: ${members};`;
  }

  if (entry.address && entry.name) {
    return `${formatDisplayName(entry.name)} <${entry.address}>`;
  }

  if (entry.address) {
    return entry.address;
  }

  return entry.name ? formatDisplayName(entry.name) : "";
}

function formatDisplayName(value: string): string {
  if (!value) {
    return "";
  }

  if (containsNonAscii(value)) {
    return mimeFuncs.encodeWords(value, "Q", 52);
  }

  return needsQuotedDisplayName(value)
    ? `"${escapeDisplayName(value)}"`
    : value;
}

function needsQuotedDisplayName(value: string): boolean {
  return /[",;<>@()[\]\\:]/.test(value);
}

function escapeDisplayName(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function unfoldHeaderValue(value: string): string {
  return value.replace(/\r?\n[ \t]+/g, " ").trim();
}

function containsNonAscii(value: string): boolean {
  return /[^\x00-\x7F]/.test(value);
}

function buildMessageId(identityEmail: string): string {
  const domain = identityEmail.split("@")[1] ?? "localhost";
  return `<${randomUUID()}@${domain}>`;
}
