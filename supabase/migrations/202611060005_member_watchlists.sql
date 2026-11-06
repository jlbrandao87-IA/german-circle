-- v0.8: member watchlists and reviewed historical asking-price observations.
-- Requires market_listings from 202611060003.
create table if not exists public.member_watchlists (
  owner_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(owner_id,listing_id)
);
create index if not exists member_watchlists_listing_idx on public.member_watchlists(listing_id);
alter table public.member_watchlists enable row level security;
create policy watchlist_own_read on public.member_watchlists for select to authenticated using(owner_id=(select auth.uid()));
create policy watchlist_own_insert on public.member_watchlists for insert to authenticated with check (
 owner_id=(select auth.uid()) and exists(
 select 1 from public.market_listings ml where ml.id=listing_id and ml.status='approved' and ml.expires_at>now() and ml.verified_at>now()-interval '7 days'
 ));
create policy watchlist_own_delete on public.member_watchlists for delete to authenticated using(owner_id=(select auth.uid()));
revoke all on public.member_watchlists from anon,authenticated;
grant select,insert,delete on public.member_watchlists to authenticated;

create table if not exists public.market_price_observations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  price_eur numeric(12,2) not null check(price_eur>0),
  observed_at timestamptz not null,
  source_reference text not null check(length(trim(source_reference))>0),
  authorization_reference text not null check(length(trim(authorization_reference))>0),
  reviewed_at timestamptz not null default now(),
  unique(listing_id,observed_at)
);
create index if not exists market_price_observations_history_idx on public.market_price_observations(listing_id,observed_at desc);
alter table public.market_price_observations enable row level security;
create policy history_member_read on public.market_price_observations for select to authenticated using (
 exists (select 1 from public.market_listings ml where ml.id=listing_id and ml.status='approved' and ml.expires_at>now() and ml.verified_at>now()-interval '7 days')
);
revoke all on public.market_price_observations from anon,authenticated;
grant select on public.market_price_observations to authenticated;
-- Both table ingestion and history updates require a trusted backend with explicit authorized sources.
-- Never insert synthetic snapshots or expose service_role credentials in the browser.
