-- German Circle v0.3: deliberately private-by-default. Run in Supabase SQL Editor after review.
create extension if not exists pgcrypto;
create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.garage_vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('dream','owned')),
  brand text not null check (brand in ('Porsche','Mercedes-Benz','BMW','Audi')),
  model text not null check (char_length(trim(model)) between 1 and 55),
  version text check (char_length(version)<=80),
  year_from int check (year_from between 1960 and 2035),
  budget_eur numeric(12,2) check (budget_eur between 0 and 10000000),
  horizon text not null default 'explorar' check (horizon in ('explorar','0-6','6-12','12+')),
  notes text check (char_length(notes)<=500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists garage_vehicles_owner_kind_idx on public.garage_vehicles(owner_id,kind,created_at desc);
create table if not exists public.member_consents (
  owner_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('newsletter','personalized_alerts','community_profile')),
  granted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(owner_id,purpose)
);
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create trigger touch_profiles before update on public.member_profiles for each row execute function public.touch_updated_at();
create trigger touch_garage before update on public.garage_vehicles for each row execute function public.touch_updated_at();
create trigger touch_consents before update on public.member_consents for each row execute function public.touch_updated_at();
-- Prevent race conditions when two devices add vehicles at the same time.
create or replace function public.limit_garage_vehicles() returns trigger language plpgsql set search_path='' as $$
declare current_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text || ':' || new.kind,0));
  select count(*) into current_count from public.garage_vehicles
  where owner_id = new.owner_id and kind = new.kind and id <> new.id;
  if current_count >= 5 then raise exception 'Garage vehicle limit reached'; end if;
  return new;
end $$;
create trigger guard_garage_limit before insert or update of owner_id,kind on public.garage_vehicles
  for each row execute function public.limit_garage_vehicles();
-- Row-level security: anon cannot access private tables.
alter table public.member_profiles enable row level security;
alter table public.garage_vehicles enable row level security;
alter table public.member_consents enable row level security;
create policy profile_read_own on public.member_profiles for select to authenticated using ((select auth.uid())=id);
create policy profile_insert_own on public.member_profiles for insert to authenticated with check ((select auth.uid())=id);
create policy profile_update_own on public.member_profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy profile_delete_own on public.member_profiles for delete to authenticated using ((select auth.uid())=id);
create policy cars_read_own on public.garage_vehicles for select to authenticated using ((select auth.uid())=owner_id);
create policy cars_insert_own on public.garage_vehicles for insert to authenticated with check ((select auth.uid())=owner_id);
create policy cars_update_own on public.garage_vehicles for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy cars_delete_own on public.garage_vehicles for delete to authenticated using ((select auth.uid())=owner_id);
create policy consents_read_own on public.member_consents for select to authenticated using ((select auth.uid())=owner_id);
create policy consents_insert_own on public.member_consents for insert to authenticated with check ((select auth.uid())=owner_id);
create policy consents_update_own on public.member_consents for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy consents_delete_own on public.member_consents for delete to authenticated using ((select auth.uid())=owner_id);
revoke all on public.member_profiles,public.garage_vehicles,public.member_consents from anon;
grant select,insert,update,delete on public.member_profiles,public.garage_vehicles,public.member_consents to authenticated;
