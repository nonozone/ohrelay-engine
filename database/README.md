# Engine-Safe Migrations

This repository currently includes only the engine-safe schema bootstrap copied from the private monorepo:

- `0001` through `0010`

These migrations cover the original relay data model without the later SaaS auth, billing, or control-plane-only tables.

They are included because they help explain the original storage model around:

- inbound events
- reply context
- identity routes
- working inbox mapping

Later migrations that primarily serve product operations remain private until the standalone engine extraction is complete.
