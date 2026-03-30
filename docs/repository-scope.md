# Public Repository Scope

This repository is for the trust-boundary components that matter when evaluating privacy and message handling behavior.

## Included Now

These parts are already public because they are close to the mail-processing trust boundary:

- email normalization helpers
- SMTP error primitives
- worker ingest client
- worker metadata extraction and verification code sniffing
- engine MIME rewriting and thread header parsing
- reply identity resolution
- SMTP credential encryption helpers
- raw-email delivery adapters for SMTP, Resend SMTP, and SES
- engine-safe schema migrations

## Excluded For Now

These parts remain private because they are product-layer concerns, not required to explain or audit the core mail-routing mechanism:

- dashboard and website code
- organization management flows
- billing and referrals
- Cloudflare onboarding orchestration
- private deployment assets

## Planned Next

The next public import should extend the standalone engine package with the runtime pieces that still depend on engine-only infrastructure:

- engine HTTP routes
- inbound/outbound event recording repositories
- SMTP submission runtime and provider selection wiring

## Boundary Rule

When deciding whether something belongs in this repository, the rule is:

"Does this code help a third party understand how OhRelay handles email identities, routing, forwarding, and reply restoration?"

If yes, it likely belongs here.

If it mainly supports SaaS administration, onboarding, billing, or product operations, it likely stays private.
