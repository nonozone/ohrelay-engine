import { randomUUID } from "node:crypto";

export type RewriteBootstrapInput = {
  identityEmail: string;
  displayName: string;
  targetRecipientEmail: string;
  operatorPrivateEmail?: string;
  generateMessageId?: () => string;
};

type HeaderEntry = {
  name: string;
  value: string;
};

export type RewriteBootstrapResult = {
  raw: string;
  messageId: string;
};

export function rewriteBootstrapMessage(
  raw: string,
  input: RewriteBootstrapInput
): RewriteBootstrapResult {
  const boundaryIndex = raw.indexOf("\r\n\r\n");

  if (boundaryIndex < 0) {
    throw new Error("Missing header boundary");
  }

  const headerSection = raw.slice(0, boundaryIndex);
  const bodySection = raw.slice(boundaryIndex + 4);
  const headers = parseHeaders(headerSection).filter((header) => {
    const name = header.name.toLowerCase();
    return ![
      "in-reply-to",
      "references",
      "dkim-signature",
      "x-google-dkim-signature",
      "x-gm-message-state",
      "x-google-smtp-source"
    ].includes(name);
  });

  let hasFrom = false;
  let hasTo = false;
  let hasSender = false;
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

    if (name === "to") {
      hasTo = true;
      return {
        name: header.name,
        value: input.targetRecipientEmail
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

  if (!hasTo) {
    rewritten.push({
      name: "To",
      value: input.targetRecipientEmail
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

  const serializedHeaders = rewritten
    .map((header) => `${header.name}: ${header.value}`)
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

function buildMessageId(identityEmail: string): string {
  const domain = identityEmail.split("@")[1] ?? "localhost";
  return `<${randomUUID()}@${domain}>`;
}
