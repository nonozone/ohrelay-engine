# apps/engine

This directory is reserved for the standalone engine extraction.

The next import pass should move in the engine-only runtime:

- SMTP submission handling
- reply identity resolution
- MIME rewriting
- outbound delivery providers
- engine HTTP routes
- engine-safe migration runner

It intentionally stays out of the workspace until those imports are detached from private control-plane code.

