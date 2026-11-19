-- Smart Deals India — initial Supabase schema
-- Run in the intended Smart Deals India project. Uses explicit grants + RLS.
-- Data ingestion must use permitted affiliate feeds, official APIs or merchant-approved sources.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website_url text,
  logo_url text,
  merchant_type text not null default 'retail' check (merchant_type in ('retail','food','travel','utilities','other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants(id) on delete set null,
  name text not null,
  slug text not null unique,
  brand text,
  image_url text,
  product_url text,
  category text not null default 'shopping' check (category in ('shopping','food','travel','bills')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.price_observations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  merchant_id uuid references public.merchants(id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  currency char(3) not null default 'INR',
  source_label text not null,
  source_url text,
  source_type text not null default 'manual' check (source_type in ('manual','affiliate_feed','official_api','merchant_page')),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'shopping' check (category in ('shopping','food','travel','bills')),
  offer_type text not null default 'price_drop' check (offer_type in ('price_drop','coupon','bank_offer','bundle','cashback','limited_offer')),
  offer_price numeric(12,2) check (offer_price is null or offer_price >= 0),
  original_price numeric(12,2) check (original_price is null or original_price >= 0),
  discount_label text,
  trust_label text not null default 'Price evidence pending',
  source_label text not null,
  source_url text,
  affiliate_url text,
  source_external_id text,
  status text not null default 'draft' check (status in ('draft','pending','active','expired','rejected')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deals_valid_window check (ends_at > starts_at)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid references public.merchants(id) on delete set null,
  title text not null,
  code text,
  description text,
  category text not null default 'food' check (category in ('shopping','food','travel','bills')),
  source_label text not null,
  source_url text,
  terms_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  status text not null default 'draft' check (status in ('draft','pending','active','expired','rejected')),
  created_at timestamptz not null default now(),
  constraint coupons_valid_window check (ends_at > starts_at)
);

create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  target_price numeric(12,2) check (target_price is null or target_price >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  target_price numeric(12,2) not null check (target_price >= 0),
  is_enabled boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Query and foreign-key indexes.
create index if not exists products_status_category_idx on public.products(status, category);
create index if not exists products_merchant_id_idx on public.products(merchant_id);
create index if not exists deals_status_window_idx on public.deals(status, starts_at, ends_at);
create index if not exists deals_created_at_idx on public.deals(created_at desc);
create index if not exists deals_product_id_idx on public.deals(product_id);
create index if not exists deals_merchant_id_idx on public.deals(merchant_id);
create unique index if not exists deals_source_external_id_unique on public.deals(source_external_id) where source_external_id is not null;
create index if not exists coupons_status_window_idx on public.coupons(status, starts_at, ends_at);
create index if not exists coupons_merchant_id_idx on public.coupons(merchant_id);
create index if not exists price_observations_product_date_idx on public.price_observations(product_id, observed_at desc);
create index if not exists price_observations_merchant_id_idx on public.price_observations(merchant_id);
create index if not exists watchlists_user_idx on public.watchlists(user_id);
create index if not exists watchlists_product_id_idx on public.watchlists(product_id);
create index if not exists price_alerts_user_enabled_idx on public.price_alerts(user_id, is_enabled);
create index if not exists price_alerts_product_id_idx on public.price_alerts(product_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at before update on public.deals for each row execute function public.set_updated_at();

-- Keep profiles in sync with Supabase Auth. The trigger function is non-exposed.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

-- Enable RLS on every public table used by the Data API.
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.price_observations enable row level security;
alter table public.deals enable row level security;
alter table public.coupons enable row level security;
alter table public.watchlists enable row level security;
alter table public.price_alerts enable row level security;

-- Profiles: users can read and edit only their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Admin roster: users can see only their own role. Roles are granted by project owners in SQL.
drop policy if exists admin_users_read_own on public.admin_users;
create policy admin_users_read_own on public.admin_users for select to authenticated using ((select auth.uid()) = user_id);

-- Merchants.
drop policy if exists merchants_public_active on public.merchants;
create policy merchants_public_active on public.merchants for select to anon, authenticated using (is_active = true);
drop policy if exists merchants_admin_read on public.merchants;
create policy merchants_admin_read on public.merchants for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists merchants_admin_insert on public.merchants;
create policy merchants_admin_insert on public.merchants for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists merchants_admin_update on public.merchants;
create policy merchants_admin_update on public.merchants for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor'))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists merchants_admin_delete on public.merchants;
create policy merchants_admin_delete on public.merchants for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin'));

-- Products.
drop policy if exists products_public_published on public.products;
create policy products_public_published on public.products for select to anon, authenticated using (status = 'published');
drop policy if exists products_admin_read on public.products;
create policy products_admin_read on public.products for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor'))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin'));

-- Price history: public can read history for published products; editors can add source-backed observations.
drop policy if exists observations_public_published on public.price_observations;
create policy observations_public_published on public.price_observations for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
drop policy if exists observations_admin_read on public.price_observations;
create policy observations_admin_read on public.price_observations for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists observations_admin_insert on public.price_observations;
create policy observations_admin_insert on public.price_observations for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));

-- Deals.
drop policy if exists deals_public_active on public.deals;
create policy deals_public_active on public.deals for select to anon, authenticated using (status = 'active' and starts_at <= now() and ends_at > now());
drop policy if exists deals_admin_read on public.deals;
create policy deals_admin_read on public.deals for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists deals_admin_insert on public.deals;
create policy deals_admin_insert on public.deals for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists deals_admin_update on public.deals;
create policy deals_admin_update on public.deals for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor'))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists deals_admin_delete on public.deals;
create policy deals_admin_delete on public.deals for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin'));

-- Coupons.
drop policy if exists coupons_public_active on public.coupons;
create policy coupons_public_active on public.coupons for select to anon, authenticated using (status = 'active' and starts_at <= now() and ends_at > now());
drop policy if exists coupons_admin_read on public.coupons;
create policy coupons_admin_read on public.coupons for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists coupons_admin_insert on public.coupons;
create policy coupons_admin_insert on public.coupons for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists coupons_admin_update on public.coupons;
create policy coupons_admin_update on public.coupons for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor'))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role in ('admin','editor')));
drop policy if exists coupons_admin_delete on public.coupons;
create policy coupons_admin_delete on public.coupons for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.role = 'admin'));

-- User-owned watchlist and alert settings.
drop policy if exists watchlists_select_own on public.watchlists;
create policy watchlists_select_own on public.watchlists for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists watchlists_insert_own on public.watchlists;
create policy watchlists_insert_own on public.watchlists for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists watchlists_update_own on public.watchlists;
create policy watchlists_update_own on public.watchlists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists watchlists_delete_own on public.watchlists;
create policy watchlists_delete_own on public.watchlists for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists alerts_select_own on public.price_alerts;
create policy alerts_select_own on public.price_alerts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists alerts_insert_own on public.price_alerts;
create policy alerts_insert_own on public.price_alerts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists alerts_update_own on public.price_alerts;
create policy alerts_update_own on public.price_alerts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists alerts_delete_own on public.price_alerts;
create policy alerts_delete_own on public.price_alerts for delete to authenticated using ((select auth.uid()) = user_id);

-- Reset broad default table grants and grant only the privileges the app requires.
revoke all privileges on public.profiles, public.admin_users, public.merchants, public.products, public.price_observations, public.deals, public.coupons, public.watchlists, public.price_alerts from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.merchants, public.products, public.price_observations, public.deals, public.coupons to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.watchlists, public.price_alerts to authenticated;
grant insert, update, delete on public.merchants, public.products, public.deals, public.coupons to authenticated;
grant insert on public.price_observations to authenticated;
