create table if not exists identity_registry (
  identity_email text primary key,
  domain text not null,
  status text not null default 'passive',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  last_contact_email text,
  activated_at timestamptz,
  deactivated_at timestamptz
);

create index if not exists identity_registry_domain_idx
  on identity_registry (domain);

create index if not exists identity_registry_status_idx
  on identity_registry (status);

create index if not exists identity_registry_last_seen_at_idx
  on identity_registry (last_seen_at desc);
