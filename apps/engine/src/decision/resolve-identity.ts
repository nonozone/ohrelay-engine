import { normalizeEmailAddress, normalizeMessageId } from "@ohrelay/shared";

export type ResolveIdentityInput = {
  inReplyTo: string | null;
  references: string[];
  recipients: string[];
};

export type ResolveIdentityRepos = {
  findThreadIdentity(messageId: string): Promise<string | null>;
  findRecipientIdentities(recipient: string): Promise<string[]>;
};

export type ResolveIdentityResult =
  | {
      status: "resolved";
      decisionSource: "thread" | "state";
      identityEmail: string;
    }
  | { status: "rejected"; reason: "identity_conflict" | "no_mapping" };

export async function resolveIdentity(
  input: ResolveIdentityInput,
  repos: ResolveIdentityRepos
): Promise<ResolveIdentityResult> {
  const threadCandidates = buildThreadCandidates(input);

  for (const candidate of threadCandidates) {
    const match = await repos.findThreadIdentity(candidate);

    if (match) {
      return {
        status: "resolved",
        decisionSource: "thread",
        identityEmail: normalizeEmailAddress(match)
      };
    }
  }

  const normalizedRecipients = input.recipients.map(normalizeEmailAddress);
  const uniqueIdentities = new Set<string>();

  for (const recipient of normalizedRecipients) {
    const identities = await repos.findRecipientIdentities(recipient);

    for (const identity of identities) {
      uniqueIdentities.add(normalizeEmailAddress(identity));
    }
  }

  if (uniqueIdentities.size === 1) {
    return {
      status: "resolved",
      decisionSource: "state",
      identityEmail: [...uniqueIdentities][0] as string
    };
  }

  if (uniqueIdentities.size > 1) {
    return {
      status: "rejected",
      reason: "identity_conflict"
    };
  }

  return {
    status: "rejected",
    reason: "no_mapping"
  };
}

function buildThreadCandidates(input: ResolveIdentityInput): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const inReplyTo = normalizeMessageId(input.inReplyTo);

  if (inReplyTo) {
    candidates.push(inReplyTo);
    seen.add(inReplyTo);
  }

  for (const reference of [...input.references].reverse()) {
    const normalized = normalizeMessageId(reference);

    if (normalized && !seen.has(normalized)) {
      candidates.push(normalized);
      seen.add(normalized);
    }
  }

  return candidates;
}
