-- v0.7: separate admin-reviewed landed-cost quotations. Never expose credentials
-- for privileged ingestion to the client. Inserting quotes requires trusted server.
create table if not exists public.market_import_quotes (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.market_listings(id) on delete cascade,
 purchase_eur numeric(12,2) not null check (purchase_eur>0),
 isv_eur numeric(12,2) check (isv_eur>=0),
 vat_eur numeric(12,2) check (vat_eur>=0),
 transport_eur numeric(12,2) check (transport_eur>=0),
 inspection_eur numeric(12,2) check (inspection_eur>=0),
 registration_eur numeric(12,2) check (registration_eur>=0),
 service_eur numeric(12,2) check (service_eur>=0),
 other_eur numeric(12,2) check (other_eur>=0),
 source_name text not null check (length(trim(source_name))>0),
 source_reference text not null check (length(trim(source_reference))>0),
 verified_at timestamptz not null,
 valid_until timestamptz not null,
 status text not null default 'draft' check (status in ('draft','approved','withdrawn')),
 created_at timestamptz not null default now(),
 constraint quote_dates check (verified_at<valid_until),
 constraint approved_quote_complete check (status <> 'approved' or (isv_eur is not null and vat_eur is not null and transport_eur is not null and inspection_eur is not null and registration_eur is not null and service_eur is not null and other_eur is not null))
);
create unique index if not exists market_import_quotes_listing_uidx on public.market_import_quotes(listing_id);
create index if not exists market_import_quotes_active_idx on public.market_import_quotes(valid_until) where status='approved';
alter table public.market_import_quotes enable row level security;
create policy quote_member_read on public.market_import_quotes for select to authenticated using (
 status='approved' and valid_until>now() and verified_at>now()-interval '7 days' and exists (
 select 1 from public.market_listings l where l.id=listing_id and l.status='approved' and l.country='DE' and l.expires_at>now()
 )
);
revoke all on public.market_import_quotes from anon,authenticated;
grant select on public.market_import_quotes to authenticated;
