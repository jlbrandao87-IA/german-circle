-- German Circle v0.5 — reviewed, authorized listing metadata only.
-- Do not scrape or upload partner data without contractual authorization.
-- NO public INSERT/UPDATE/DELETE. Ingestion belongs to a trusted backend with audit controls.
create table if not exists public.market_listings (
 id uuid primary key default gen_random_uuid(),
 brand text not null check (brand in ('Porsche','Mercedes-Benz','BMW','Audi')),
 model text not null check (char_length(trim(model)) between 1 and 70),
 version text check (char_length(version)<=100),
 year int check (year between 1960 and 2035),
 mileage_km int check (mileage_km between 0 and 1000000),
 fuel text check (fuel in ('gasolina','diesel','hibrido','eletrico')),
 asking_price_eur numeric(12,2) not null check (asking_price_eur>0),
 country text not null check (country in ('DE','PT')),
 source_name text not null check (char_length(trim(source_name)) between 1 and 100),
 source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
 authorization_reference text not null check (char_length(trim(authorization_reference))>0),
 observed_at timestamptz not null,
 verified_at timestamptz not null,
 expires_at timestamptz not null,
 status text not null default 'draft' check (status in ('draft','approved','withdrawn')),
 created_at timestamptz not null default now(),
 constraint market_temporal_valid check (observed_at<=verified_at and verified_at<expires_at)
);
create index if not exists market_listings_active_idx on public.market_listings(brand,model,expires_at) where status='approved';
alter table public.market_listings enable row level security;
-- Signed-in members see only reviewed recent records, never drafts.
create policy market_read_approved on public.market_listings for select to authenticated
 using (status='approved' and expires_at>now() and verified_at>now()-interval '7 days');
revoke all on public.market_listings from anon,authenticated;
grant select on public.market_listings to authenticated;
-- Any write requires a trusted migration/admin workflow; never put a privileged key in the browser.
