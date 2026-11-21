# Rewalto Integration

## Current status

- Rewalto API key is stored server-side as the Supabase Edge Function secret `REWALTO_API_KEY`.
- Authentication was verified successfully through `GET /v1/whoami`.
- Rewalto account has 1,000 free credits for November 2026; 0 used and 0 held at the time of the check. The allowance expires at the end of the IST month.
- Public catalogue reads are free. Supabase currently caches 13 categories, 45 live catalogue cards, and metadata for 17 marketplace / quick-commerce entries.
- Supabase migration enables the `http` extension and creates `public.rewalto_catalogue_cache`, `public.rewalto_catalogue_entries`, and `public.refresh_rewalto_catalogue_cache()`.
- A Supabase pg_cron job named `rewalto-catalogue-refresh` refreshes only public catalogue metadata daily at 00:30 UTC (06:00 IST).
- Discovery source rows `rewalto_marketplaces` and `rewalto_quick_commerce` are intentionally paused and disabled. They are not ingesting product prices.
- The connection test Edge Function was hardened to avoid returning Rewalto organisation IDs, balances, or credentials.

## Catalogue coverage observed

The marketplace price-history dataset lists Amazon, Flipkart, Myntra, Ajio, Nykaa, Purplle, Tata 1mg, and Tata CLiQ. The quick-commerce price-history dataset lists Blinkit, Zepto, Instamart, JioMart, DMart, and BigBasket; DMart and BigBasket were marked degraded at the time of inspection.

The individual Amazon / Flipkart / Myntra search recipe cards may show `not_offered` pricing even though the aggregate marketplace history dataset is live. Do not assume every recipe is independently runnable.

## Costs and approval gate

- Public catalogue categories, cards, entry metadata, and sample records are free to read.
- Published price-history rate: 1 credit per 10 history points (₹0.10 per point at the Free/Starter top-up equivalence shown by Rewalto; actual plan pricing can differ).
- Listing rate: 1 credit per 10 listings.
- The current monthly Free allowance is 1,000 credits. No paid product-data request or recurring paid delivery has been started.
- Any paid data run must first be quoted, show exact scope / expected records / maximum credits / INR equivalent, and receive explicit user approval before quote approval or execution.

## Critical licence limitation

Rewalto's catalogue entry rights currently state that the data is collected from public pages, but customer licence terms are still being drafted and redistribution is marked `undecided`. Smart Deals India must not ingest or publicly redistribute Rewalto product records until Rewalto confirms in writing that the intended commercial display, caching, price-history retention, and user-facing redistribution are permitted.

## Security

- Never commit `REWALTO_API_KEY` to GitHub or expose it in browser code.
- Keep it in Supabase Edge Function Secrets.
- Current key scopes observed: `data:read`, `usage:read`. No `tools:run` scope was granted.
- Do not print the key or Rewalto organisation identifiers in logs or client responses.
