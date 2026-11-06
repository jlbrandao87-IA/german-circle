-- Apply after 202611060001_initial.sql. This migration does not populate any market pricing.
alter table public.garage_vehicles
  add column if not exists priority integer not null default 1 check (priority between 1 and 5),
  add column if not exists year_to integer check (year_to between 1960 and 2035),
  add column if not exists max_mileage_km integer check (max_mileage_km between 0 and 1000000),
  add column if not exists fuel text not null default 'indiferente' check (fuel in ('indiferente','gasolina','diesel','hibrido','eletrico'));
alter table public.garage_vehicles
  add constraint valid_year_range check (year_to is null or year_from is null or year_to >= year_from);
create index if not exists garage_vehicles_owner_priority_idx
  on public.garage_vehicles(owner_id,kind,priority);
-- There is deliberately no third-party listing ingestion, automatic alert or valuation claim in v0.4.
