-- v1.0: member-only alert preferences. No background delivery or external email service enabled.
create table if not exists public.member_alert_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  frequency text not null default 'weekly' check(frequency in ('off','weekly','daily')),
  min_drop_pct numeric(5,2) not null default 3 check(min_drop_pct between 1 and 30),
  include_new_matches boolean not null default true,
  include_price_drops boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.member_alert_preferences enable row level security;
create policy alert_preferences_select on public.member_alert_preferences for select to authenticated using(owner_id=(select auth.uid()));
create policy alert_preferences_insert on public.member_alert_preferences for insert to authenticated with check(owner_id=(select auth.uid()));
create policy alert_preferences_update on public.member_alert_preferences for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
revoke all on public.member_alert_preferences from anon,authenticated;
grant select,insert,update on public.member_alert_preferences to authenticated;
