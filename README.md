# ohrelay-engine

Public repository for the auditable mail-routing core behind OhRelay.

This repository is intentionally narrower than the private product monorepo. The goal is to make the trust boundary reviewable:

- how inbound addresses are normalized and resolved
- how reply identity metadata is represented
- how worker-side ingest talks to the engine
- which schema migrations are required for the engine-safe data model

## Current bootstrap contents

- `packages/shared`
  Normalization helpers, config schema, and SMTP error primitives.
- `apps/worker`
  The inbound worker and ingest client used to forward and record mail metadata.
- `database/migrations`
  Engine-safe schema migrations only (`0001` through `0010`).
- `apps/engine`
  Placeholder for the engine package that will be extracted next.

## Not included yet

- dashboard / website code
- SaaS auth and session management
- billing, referrals, and Stripe integration
- control-plane APIs and Cloudflare onboarding automation
- product-specific deployment wiring

## Repository status

This is the initial standalone repository bootstrap. It is meant to establish a clean public git history and a clear open-source boundary before more engine code is imported.

## License

No public license has been selected yet. Choose a license before publishing this repository.

