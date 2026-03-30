# Privacy Model Notes

This repository is being prepared to expose the code paths that are directly involved in email routing and reply identity restoration.

The intent is to make these questions auditable:

- what identifiers are normalized before routing
- what message metadata is persisted for reply resolution
- how inbound forwarding and post-forward ingest work
- where verification codes are extracted

This bootstrap does not yet include the full engine runtime, so this document is a starting point rather than the final public privacy statement.
