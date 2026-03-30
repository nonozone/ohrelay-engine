create table if not exists domains (
  domain text primary key,
  default_identity_email text not null,
  inbound_provider text not null,
  status text not null default 'unknown',
  last_checked_at timestamptz
);

create table if not exists thread_context (
  message_id text primary key,
  contact_email text not null,
  identity_email text not null,
  domain text not null,
  received_at timestamptz not null default now(),
  expires_at timestamptz not null,
  references_raw text
);

create table if not exists contact_identity_state (
  contact_email text not null,
  identity_email text not null,
  domain text not null,
  last_seen_at timestamptz not null default now(),
  last_message_id text,
  primary key (contact_email, identity_email)
);

create table if not exists inbound_events (
  event_id bigserial primary key,
  contact_email text not null,
  rcpt_to text not null,
  message_id text,
  forward_target text not null,
  mapping_status text not null,
  error_reason text,
  created_at timestamptz not null default now()
);

create table if not exists verification_codes (
  event_id bigserial primary key,
  source_email text not null,
  identity_email text not null,
  code text not null,
  provider_hint text,
  detected_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists outbound_events (
  event_id bigserial primary key,
  trace_id text not null,
  recipient_email text not null,
  decision_source text not null,
  identity_used text,
  result text not null,
  rejection_reason text,
  provider_message_id text,
  created_at timestamptz not null default now()
);
