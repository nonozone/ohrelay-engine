alter table identity_routes
  add column if not exists inbox_id uuid references inboxes (id);

create index if not exists identity_routes_inbox_id_idx
  on identity_routes (inbox_id);
