drop table if exists identity_registry;

alter table outbound_events
  drop column if exists activation_sync_status,
  drop column if exists activation_sync_error;
