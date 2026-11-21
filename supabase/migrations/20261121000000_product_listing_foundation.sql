-- Smart Deals India: seller-specific listing and canonical identifier foundation.
-- Applied to Supabase project pbvcumybfsjlpvdtxrgo on 2026-11-21.
-- Keep this SQL in sync with the hosted schema; review before replaying on another project.

create table if not exists public.product_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete restrict,
  source_key text not null,
  external_listing_id text,
  seller_name text,
  listing_url text not null,
  affiliate_url text,
  pin_code text,
  availability_status text not null default 'unknown'
    check (availability_status in ('in_stock','out_of_stock','limited','unknown')),
  item_price numeric(12,2) check (item_price is null or item_price >= 0),
  shipping_price numeric(12,2) check (shipping_price is null or shipping_price >= 0),
  platform_discount numeric(12,2) check (platform_discount is null or platform_discount >= 0),
  bank_discount numeric(12,2) check (bank_discount is null or bank_discount >= 0),
  cashback_amount numeric(12,2) check (cashback_amount is null or cashback_amount >= 0),
  currency char(3) not null default 'INR' check (currency = 'INR'),
  source_observed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true,
  source_terms_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_key, external_listing_id)
);

create table if not exists public.product_identifiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  identifier_type text not null check (identifier_type in ('gtin','ean','upc','isbn','mpn','brand_model','asin','fsn','seller_sku','source_id')),
  identifier_value text not null,
  source_key text,
  created_at timestamptz not null default now(),
  unique(identifier_type, identifier_value, source_key)
);

alter table public.product_listings enable row level security;
alter table public.product_identifiers enable row level security;

create policy product_listings_public_active on public.product_listings
for select to anon, authenticated using (is_active and exists (
  select 1 from public.products p where p.id=product_listings.product_id and p.status='published'
));
create policy product_listings_admin_insert on public.product_listings
for insert to authenticated with check (exists (
  select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','editor')
));
create policy product_listings_admin_update on public.product_listings
for update to authenticated using (exists (
  select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','editor')
)) with check (exists (
  select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','editor')
));
create policy product_listings_admin_delete on public.product_listings
for delete to authenticated using (exists (
  select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role='admin'
));
create policy product_identifiers_admin_all on public.product_identifiers
for all to authenticated using (exists (
  select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','editor')
)) with check (exists (
  select 1 from public.admin_users a where a.user_id=(select auth.uid()) and a.role in ('admin','editor')
));

create index if not exists idx_listings_product_active on public.product_listings(product_id,is_active,last_seen_at desc);
create index if not exists idx_listings_merchant_active on public.product_listings(merchant_id,is_active,last_seen_at desc);
create index if not exists idx_listings_source_external on public.product_listings(source_key,external_listing_id);
create index if not exists idx_identifiers_lookup on public.product_identifiers(identifier_type,identifier_value);
create index if not exists idx_observations_product_time on public.price_observations(product_id,observed_at desc);
create index if not exists idx_observations_merchant_time on public.price_observations(merchant_id,observed_at desc);
create index if not exists idx_deals_active_window on public.deals(status,starts_at,ends_at) where status='active';
create index if not exists idx_discovery_review_queue on public.deal_discovery_items(review_status,confidence_score desc,updated_at desc);

alter table public.price_observations
  add column if not exists listing_id uuid references public.product_listings(id) on delete set null,
  add column if not exists pin_code text,
  add column if not exists seller_name text,
  add column if not exists item_price numeric(12,2),
  add column if not exists shipping_price numeric(12,2),
  add column if not exists platform_discount numeric(12,2),
  add column if not exists bank_discount numeric(12,2),
  add column if not exists cashback_amount numeric(12,2),
  add column if not exists source_record_id text,
  add column if not exists ingestion_run_id uuid references public.deal_discovery_runs(id) on delete set null,
  add column if not exists source_confidence smallint not null default 50 check (source_confidence between 0 and 100);

grant select on public.product_listings to anon,authenticated;
grant select,insert,update,delete on public.product_listings to authenticated;
grant select,insert,update,delete on public.product_identifiers to authenticated;
