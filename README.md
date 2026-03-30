# ohrelay-engine

Public repository for the auditable mail-routing core behind OhRelay.

This repository is intentionally narrower than the private product monorepo.

The goal is not to open-source every SaaS concern at once. The goal is to make the trust boundary reviewable:

- how inbound addresses are normalized and resolved
- how reply identity metadata is represented
- how worker-side ingest talks to the engine
- which schema migrations are required for the engine-safe data model

## Why This Repository Exists

OhRelay's product promise depends on a few core claims:

- inbound messages are routed by explicit identity rules
- reply identity is restored from stored metadata rather than guessed ad hoc
- sensitive routing behavior can be audited instead of hidden behind a black box
- worker-side mail handling can be inspected separately from billing, dashboards, and SaaS operations

This repository exists to make those core mechanisms reviewable in public.

## What You Can Audit Here Today

- shared normalization and SMTP error primitives in `packages/shared`
- worker-side forwarding and ingest behavior in `apps/worker`
- standalone engine helpers for MIME rewriting, identity resolution, SMTP credential crypto, and outbound delivery in `apps/engine`
- engine-safe schema history in `database/migrations`

This public snapshot is still intentionally narrow, but it now includes the first standalone engine extraction in addition to the worker/shared foundations.

## Current Contents

- `packages/shared`
  Normalization helpers, config schema, and SMTP error primitives.
- `apps/worker`
  The inbound worker and ingest client used to forward and record mail metadata.
- `database/migrations`
  Engine-safe schema migrations only (`0001` through `0010`).
- `apps/engine`
  Standalone engine helpers for reply restoration, MIME rewriting, SMTP credential crypto, trace-id creation, and raw-email delivery adapters.

## What Is Intentionally Not Included Yet

- dashboard / website code
- SaaS auth and session management
- billing, referrals, and Stripe integration
- control-plane APIs and Cloudflare onboarding automation
- product-specific deployment wiring

## Documentation

- [Repository scope](./docs/repository-scope.md)
- [Privacy model notes](./docs/privacy-model.md)
- [Engine-safe migrations](./database/README.md)

## Status

This is the initial standalone repository bootstrap.

What is done:

- independent public git history
- Apache-2.0 license
- worker and shared packages imported
- engine-safe migrations imported

What comes next:

- import the remaining engine-only runtime pieces
- publish a tighter privacy/data-flow document tied to the imported engine code
- add a minimal self-hosted example for the public repository

## License

Apache-2.0. See [LICENSE](./LICENSE).
