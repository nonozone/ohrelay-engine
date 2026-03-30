import { normalizeMessageId } from "@ohrelay/shared";

export type ExtractedThreadHeaders = {
  inReplyTo: string | null;
  references: string[];
};

export function extractThreadHeaders(raw: string): ExtractedThreadHeaders {
  const boundaryIndex = raw.indexOf("\r\n\r\n");
  const headerSection = boundaryIndex >= 0 ? raw.slice(0, boundaryIndex) : raw;
  const inReplyTo = extractSingleHeader(headerSection, "in-reply-to");
  const referencesRaw = extractSingleHeader(headerSection, "references");

  return {
    inReplyTo: normalizeMessageId(inReplyTo),
    references: splitReferences(referencesRaw)
  };
}

function extractSingleHeader(
  headerSection: string,
  headerName: string
): string | null {
  const lines = headerSection.split(/\r?\n/);
  const targetLower = headerName.toLowerCase();

  let result = "";
  let inTargetHeader = false;

  for (const line of lines) {
    if (/^[ \t]/.test(line)) {
      if (inTargetHeader) {
        result += ` ${line.trim()}`;
      }
      continue;
    }

    inTargetHeader = false;
    const sepIndex = line.indexOf(":");
    if (sepIndex >= 0) {
      const currentName = line.slice(0, sepIndex).toLowerCase();
      if (currentName === targetLower) {
        inTargetHeader = true;
        result = line.slice(sepIndex + 1).trim();
      }
    }
  }

  return result.length > 0 ? result : null;
}

function splitReferences(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(/\s+/)
    .map((part) => normalizeMessageId(part))
    .filter((part): part is string => Boolean(part));
}
