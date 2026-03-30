# Privacy Model Notes

This repository is being prepared to expose the code paths that are directly involved in email routing and reply identity restoration.

The intent is to make these questions auditable:

- what identifiers are normalized before routing
- what message metadata is persisted for reply resolution
- how inbound forwarding and post-forward ingest work
- where verification codes are extracted

## What The Current Public Snapshot Actually Shows

Today this public repository includes the worker-side code path that:

- reads sender and recipient envelope addresses
- reads selected headers such as `message-id`, `subject`, and `references`
- forwards the inbound message to the resolved working inbox
- records routing metadata after forward succeeds
- optionally extracts a numeric verification code from the message subject

That behavior is visible in `apps/worker/src`.

## Data Shapes Visible In This Snapshot

The currently published code makes it possible to inspect these categories of data handling:

- normalized sender email address
- normalized identity email address
- message id
- references header
- forward target
- inbound routing result metadata
- verification codes extracted from the subject line

## Important Boundaries

This public bootstrap does not yet contain the full engine runtime, so it does not yet fully document:

- SMTP submission handling
- reply identity restoration during outbound send
- outbound provider delivery calls
- SMTP gateway credential flows
- retention behavior for the newer managed sending profile model

That means this document is a starting point, not the final public privacy statement.

## What This Snapshot Does Not Claim

This repository should not yet be read as "the whole OhRelay product is open source."

It is specifically a public trust-boundary repository. Its purpose is to let third parties inspect the code that is closest to mail routing and metadata handling, while the rest of the SaaS product remains private for now.
