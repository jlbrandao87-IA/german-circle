-- German Circle v1.3: security perimeter and append-only import audit.
-- Provision admin membership via a privileged SQL operator, never from the browser.
create table if not exists public.ingestion_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.market_import_audit (
 id bigint generated always as identity primary key,
 actor_id uuid not null references auth.users(id),
 supplier_id text not null references public.market_suppliers(id),
 batch_rows integer not null check(batch_rows>=0),
 accepted integer not null check(accepted>=0),
 rejected integer not null check(rejected>=0),
 inserted integer not null check(inserted>=0),
 duplicate integer not null check(duplicate>=0),
 error_code text,
 created_at timestamptz not null default now()
);
alter table public.ingestion_admins enable row level security;
alter table public.market_import_audit enable row level security;
revoke all on public.ingestion_admins from anon,authenticated;
revoke all on public.market_import_audit from anon,authenticated;
-- RLS policies intentionally omitted: only server-side service credentials.
-- Keep service role credentials in the server environment, never NEXT_PUBLIC_ variables.
