-- v1.1 -- approved supplier registry and private review queue.
-- ONLY a privileged server/DB operator can write here; browser users have no access.
create table if not exists public.market_suppliers (
 id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
 display_name text not null,
 permission_reference text not null,
 permission_valid_until timestamptz not null,
 allowed_hosts text[] not null,
 allowed_countries text[] not null,
 allows_display boolean not null default false,
 allows_price_history boolean not null default false,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.market_import_review_queue (
 id bigint generated always as identity primary key,
 supplier_id text not null references public.market_suppliers(id),
 supplier_listing_id text not null,
 payload jsonb not null,
 payload_checksum text not null check (length(payload_checksum)=64),
 review_status text not null default 'pending' check(review_status in ('pending','approved','rejected')),
 reviewer_note text,
 imported_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 unique(supplier_id,supplier_listing_id,payload_checksum)
);
create index if not exists market_review_pending_idx on public.market_import_review_queue(review_status,imported_at);
alter table public.market_suppliers enable row level security;
alter table public.market_import_review_queue enable row level security;
revoke all on public.market_suppliers from anon,authenticated;
revoke all on public.market_import_review_queue from anon,authenticated;
-- No policies: RLS denies members. Approval/publication is deliberately a separate
-- privileged, audited server operation after checking contractual rights and data.
