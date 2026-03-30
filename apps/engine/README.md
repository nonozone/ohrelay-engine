# apps/engine

Standalone engine package for the public OhRelay trust boundary.

This first extraction batch includes:

- MIME rewriting
- thread-header extraction
- reply identity resolution
- SMTP password encryption helpers
- outbound trace-id generation
- raw-email delivery adapters for SMTP, Resend SMTP, and SES

Still intentionally excluded in this batch:

- database repositories
- HTTP routes and runtime wiring
- SMTP submission server runtime
- control-plane integrations
