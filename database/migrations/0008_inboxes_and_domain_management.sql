create table if not exists inboxes (
  id uuid primary key,
  user_id uuid not null,
  email text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inboxes_status_check check (status in ('active', 'paused')),
  constraint inboxes_user_email_unique unique (user_id, email)
);

create index if not exists inboxes_user_id_idx
  on inboxes (user_id);

alter table domains
  add column if not exists onboarding_mode text not null default 'manual',
  add column if not exists dns_status text not null default 'pending',
  add column if not exists worker_status text not null default 'pending',
  add column if not exists email_routing_status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();
