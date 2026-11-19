# Smart Deals India — Loot Radar

A mobile-first Indian deal discovery and savings PWA. The product experience is intentionally closer to a curated “loot radar” than a plain discount directory: high-contrast deal cards, shopping and food categories, visible offer sources, price observations, watchlists and price signals.

## What is included

- **Home / Loot Radar:** branded discovery page, category shortcuts, curated sample feed and price-watch call to action.
- **Shopping Loot:** searchable catalogue with category filters, sort by newest or listed-reference comparison, merchant and source labels.
- **Food Offers:** food and dining coupon feed with copy-code action.
- **Price Watch:** Supabase email sign-in, personal watchlist, target prices and a 30-day chart based on saved observations.
- **Conservative price signal:** the UI needs at least five observations across seven days before comparing the latest record with the tracked 30-day median.
- **Admin Studio:** admin/editor-only publishing for deals and coupons. The UI requires a source label and evidence URL.
- **PWA:** web manifest, generated app icons, service-worker registration, offline fallback and mobile bottom navigation.
- **Legal / trust pages:** privacy, terms and affiliate disclosure starter pages for review before public launch.

## Stack

- Next.js App Router + TypeScript + React
- Supabase Postgres + Auth + Data API
- Vercel deployment target

## Routes

| Route | Purpose |
|---|---|
| `/` | Loot Radar home |
| `/deals` | Shopping offers |
| `/food` | Food and dining offers |
| `/price-tracker` | Watchlist and price history |
| `/login` | Email one-time-link sign-in |
| `/admin` | Restricted deal/coupon management |
| `/privacy` | Privacy policy starter |
| `/terms` | Terms starter |
| `/affiliate-disclosure` | Affiliate disclosure starter |
| `/offline` | PWA offline fallback |

## Local setup

1. Use Node.js 22 or newer and npm.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`.
4. Run `npm install`, `npm run typecheck`, then `npm run dev`.
5. Open `http://localhost:3000`.

The publishable key is designed for browser use. Never add a Supabase service-role/secret key to `.env.example`, frontend code or Git.

## Supabase setup

The Mumbai project (`ap-south-1`) has the nine application tables and policies represented in `supabase/schema.sql`. The schema includes explicit Data API grants and RLS because grants and RLS are separate controls. All exposed application tables have RLS enabled; public roles have read-only access to active/published catalogue data, while user-owned rows are restricted by `auth.uid()` and publishing is restricted by the admin roster.

The initial database migration has been applied and verified in the Mumbai Supabase project. Three current bank-funded promotions were manually reviewed and inserted from ICICI Bank official offer terms. `supabase/schema.sql` is the repeatable reference for a fresh project; inspect before applying it elsewhere.

## Grant the first admin account

1. Sign in once using the email that should own the admin panel.
2. In Supabase SQL Editor, run this query and replace the email:

```sql
insert into public.admin_users (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_SIGN_IN_EMAIL'
on conflict (user_id) do update set role = excluded.role;
```

3. Open `/admin`. A browser user cannot grant themselves admin access.

## Data and price integrity

The cards displayed before the database has published offers are explicitly marked sample/illustrative. They are not current retailer prices, active coupons or verified discounts. Live deals must come from approved affiliate feeds, official APIs, merchant-provided data or manually reviewed sources whose terms allow display. Do not scrape marketplaces or food-delivery platforms without permission.

A first price observation is only one dated data point. The price signal is not a claim about all-time-low or guaranteed live checkout price. Marketplace integrations (including Amazon and Flipkart product feeds) are intentionally deferred until after the MVP launch. A previously deployed Flipkart Edge Function is dormant without affiliate credentials; it is not part of the current MVP user flow. Do not add affiliate credentials or enable scheduled sync during the MVP phase. Push notifications are not enabled yet.

See `docs/PRODUCT_SPEC.md`, `docs/DATA_INTEGRATION_PLAN.md` and `docs/REAL_DATA_SETUP.md` for data source onboarding and live sync setup.

## Build / validation note

The TypeScript/TSX source files pass a syntax-transpile check. A full Next.js typecheck/build still needs dependency installation; package installation could not complete in the current environment because the package registry connection timed out.

## Before public launch

- Commit the project to GitHub and connect the repo to Vercel.
- Set production environment variables and the real site URL.
- Configure Supabase Auth redirect URLs for the production domain.
- Add the first admin account.
- After MVP validation, connect approved retailer APIs/product feeds and scheduled ingestion.
- Configure a notification provider and user opt-in before enabling alerts.
- Review Privacy, Terms and Affiliate Disclosure for the final company/legal entity and actual data practices.


## Post-MVP integrations

Marketplace API onboarding and credentials are intentionally postponed. When the MVP is stable, use [`docs/INDIA_PLATFORM_CONNECTORS.md`](docs/INDIA_PLATFORM_CONNECTORS.md) as the future integration reference. No retailer credentials are required for the current MVP.
