do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'outbound_events'
      and column_name = 'ses_message_id'
  ) then
    alter table outbound_events
      rename column ses_message_id to provider_message_id;
  end if;
end $$;
