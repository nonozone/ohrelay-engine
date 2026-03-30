export type WorkerEnv = {
  FORWARD_TARGET_EMAIL: string;
  INGEST_PROVIDER?: "supabase-rest" | "core-http";
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  CORE_INGEST_BASE_URL?: string;
  CORE_INGEST_TOKEN?: string;
};

export type InboundRecordPayload = {
  thread: Record<string, unknown>;
  state: Record<string, unknown>;
  inboundEvent: Record<string, unknown>;
};

export type VerificationCodePayload = Record<string, unknown>;

export type IngestClient = {
  resolveInbound(payload: {
    identity_email: string;
  }): Promise<
    | {
        action: "forward";
        target: string;
        identity_email: string;
        route_id: string;
      }
    | {
        action: "reject";
        reason: string;
      }
  >;
  recordInbound(payload: InboundRecordPayload): Promise<void>;
  recordVerificationCode(payload: VerificationCodePayload): Promise<void>;
};

type FetchLike = typeof fetch;

export function createIngestClient(
  env: WorkerEnv,
  deps: {
    fetch?: FetchLike;
  } = {}
): IngestClient {
  const fetchImpl = deps.fetch ?? fetch;

  if (env.INGEST_PROVIDER === "core-http") {
    if (!env.CORE_INGEST_BASE_URL || !env.CORE_INGEST_TOKEN) {
      throw new Error("CORE_INGEST_BASE_URL and CORE_INGEST_TOKEN are required for core-http ingest");
    }

    return {
      resolveInbound: async (payload) => {
        const response = await fetchImpl(joinUrl(env.CORE_INGEST_BASE_URL as string, "/internal/routing/resolve-inbound"), {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.CORE_INGEST_TOKEN}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`resolve-inbound failed with status ${response.status}`);
        }

        return response.json() as Promise<
          | {
              action: "forward";
              target: string;
              identity_email: string;
              route_id: string;
            }
          | {
              action: "reject";
              reason: string;
            }
        >;
      },
      recordInbound: async (payload) => {
        await fetchImpl(joinUrl(env.CORE_INGEST_BASE_URL as string, "/internal/ingest/inbound"), {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.CORE_INGEST_TOKEN}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      },
      recordVerificationCode: async (payload) => {
        await fetchImpl(joinUrl(env.CORE_INGEST_BASE_URL as string, "/internal/ingest/verification-codes"), {
          method: "POST",
          headers: {
            authorization: `Bearer ${env.CORE_INGEST_TOKEN}`,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }
    };
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required for supabase-rest ingest");
  }

  return {
    resolveInbound: async () => {
      throw new Error("resolveInbound requires core-http ingest");
    },
    recordInbound: async (payload) => {
      await Promise.all([
        insertSupabaseRecord(fetchImpl, env, "thread_context", payload.thread),
        insertSupabaseRecord(fetchImpl, env, "contact_identity_state", payload.state),
        insertSupabaseRecord(fetchImpl, env, "inbound_events", payload.inboundEvent)
      ]);
    },
    recordVerificationCode: async (payload) => {
      await insertSupabaseRecord(fetchImpl, env, "verification_codes", payload);
    }
  };
}

async function insertSupabaseRecord(
  fetchImpl: FetchLike,
  env: WorkerEnv,
  table: string,
  payload: Record<string, unknown>
): Promise<void> {
  await fetchImpl(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY as string,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY as string}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

function joinUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${pathname}`;
}
