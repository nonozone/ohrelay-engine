alter table outbound_events
  add column if not exists activation_sync_status text not null default 'not_applicable';

alter table outbound_events
  add column if not exists activation_sync_error text;
