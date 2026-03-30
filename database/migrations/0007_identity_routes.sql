create table if not exists identity_routes (
  id uuid primary key,
  user_id uuid not null,
  identity_email text not null,
  forward_target_email text not null,
  domain text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identity_routes_identity_email_unique unique (identity_email),
  constraint identity_routes_status_check check (status in ('active', 'paused'))
);

create index if not exists identity_routes_user_id_idx
  on identity_routes (user_id);

create index if not exists identity_routes_domain_idx
  on identity_routes (domain);

create index if not exists identity_routes_user_domain_idx
  on identity_routes (user_id, domain);
