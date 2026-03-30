create index if not exists thread_context_contact_email_idx
  on thread_context (contact_email);

create index if not exists thread_context_expires_at_idx
  on thread_context (expires_at);

create index if not exists contact_identity_state_contact_email_idx
  on contact_identity_state (contact_email);

create index if not exists inbound_events_created_at_idx
  on inbound_events (created_at desc);

create index if not exists verification_codes_expires_at_idx
  on verification_codes (expires_at);

create index if not exists outbound_events_created_at_idx
  on outbound_events (created_at desc);
