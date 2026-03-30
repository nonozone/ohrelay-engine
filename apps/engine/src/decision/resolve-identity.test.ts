import { describe, expect, it } from "vitest";

import {
  resolveIdentity,
  type ResolveIdentityRepos
} from "./resolve-identity.js";

describe("resolveIdentity", () => {
  it("prefers an in-reply-to thread match", async () => {
    const repos = createDecisionFixtures({
      threadByMessageId: {
        "<thread-1@example.com>": "support@brand-a.com"
      },
      identitiesByRecipient: {}
    });

    const result = await resolveIdentity(
      {
        inReplyTo: "<thread-1@example.com>",
        references: [],
        recipients: ["client@abc.com"]
      },
      repos
    );

    expect(result).toEqual({
      status: "resolved",
      decisionSource: "thread",
      identityEmail: "support@brand-a.com"
    });
  });

  it("falls back to a unique recipient identity", async () => {
    const repos = createDecisionFixtures({
      threadByMessageId: {},
      identitiesByRecipient: {
        "client@abc.com": ["support@brand-a.com"]
      }
    });

    const result = await resolveIdentity(
      {
        inReplyTo: null,
        references: [],
        recipients: ["client@abc.com"]
      },
      repos
    );

    expect(result).toEqual({
      status: "resolved",
      decisionSource: "state",
      identityEmail: "support@brand-a.com"
    });
  });

  it("rejects when a recipient maps to multiple identities", async () => {
    const repos = createDecisionFixtures({
      threadByMessageId: {},
      identitiesByRecipient: {
        "client@abc.com": ["support@brand-a.com", "hello@brand-b.com"]
      }
    });

    const result = await resolveIdentity(
      {
        inReplyTo: null,
        references: [],
        recipients: ["client@abc.com"]
      },
      repos
    );

    expect(result).toMatchObject({
      status: "rejected",
      reason: "identity_conflict"
    });
  });

  it("rejects when no mapping exists", async () => {
    const repos = createDecisionFixtures({
      threadByMessageId: {},
      identitiesByRecipient: {}
    });

    const result = await resolveIdentity(
      {
        inReplyTo: null,
        references: [],
        recipients: ["client@abc.com"]
      },
      repos
    );

    expect(result).toMatchObject({
      status: "rejected",
      reason: "no_mapping"
    });
  });

  it("searches all references from newest to oldest until a thread match is found", async () => {
    const lookups: string[] = [];
    const repos: ResolveIdentityRepos = {
      findThreadIdentity: async (messageId: string) => {
        lookups.push(messageId);
        return messageId === "<thread-2@example.com>"
          ? "support@brand-a.com"
          : null;
      },
      findRecipientIdentities: async () => []
    };

    const result = await resolveIdentity(
      {
        inReplyTo: null,
        references: [
          "<thread-1@example.com>",
          "<thread-2@example.com>",
          "<thread-3@example.com>"
        ],
        recipients: ["client@abc.com"]
      },
      repos
    );

    expect(lookups).toEqual(["<thread-3@example.com>", "<thread-2@example.com>"]);
    expect(result).toEqual({
      status: "resolved",
      decisionSource: "thread",
      identityEmail: "support@brand-a.com"
    });
  });
});

function createDecisionFixtures(input: {
  threadByMessageId: Record<string, string>;
  identitiesByRecipient: Record<string, string[]>;
}): ResolveIdentityRepos {
  return {
    findThreadIdentity: async (messageId: string) =>
      input.threadByMessageId[messageId] ?? null,
    findRecipientIdentities: async (recipient: string) =>
      input.identitiesByRecipient[recipient] ?? []
  };
}
