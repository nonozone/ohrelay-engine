create table if not exists delivery_feedback_events (
  id bigserial primary key,
  provider text not null,
  feedback_type text not null,
  feedback_subtype text,
  identity_email text,
  domain text,
  provider_message_id text,
  source_email text,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists delivery_feedback_events_created_at_idx
  on delivery_feedback_events (created_at desc);

create index if not exists delivery_feedback_events_domain_idx
  on delivery_feedback_events (domain, created_at desc);
