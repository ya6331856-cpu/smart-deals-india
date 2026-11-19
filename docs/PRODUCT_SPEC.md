# Smart Deals India — Product Specification

## Product promise
A fast, mobile-first Indian deal discovery product that helps shoppers find shopping and food offers while showing the evidence behind each listing. The interface uses a high-contrast “loot radar” aesthetic, but avoids claiming a deal is genuine unless the stored price history supports that conclusion.

## Primary audiences
- Value-conscious online shoppers in India.
- People comparing bank offers, coupons and brand promotions.
- Shoppers who want to wait for a chosen target price.

## Main navigation
- Home / Loot Radar: discovery hero, categories, curated offers and product watch entry point.
- Shopping Loot: searchable, filterable catalogue of shopping offers.
- Food Offers: food and dining coupons and merchant promotions.
- Price Watch: account watchlist, target price, 30-day observation chart and cautious price signal.
- Sign in: email one-time link through Supabase Auth.
- Admin Studio: private admin/editor-only interface to publish deals and coupons with source evidence.

## Deal card information hierarchy
1. Merchant and offer category.
2. Offer title and plain-language conditions.
3. Current offer amount, when provided.
4. Listed reference amount, visually secondary and explicitly labelled as a reference.
5. Discount percentage only as a comparison with that listed reference amount.
6. Price-evidence status (pending / insufficient history / evidence-backed).
7. Source label and source evidence link.
8. Coupon copy action or affiliate/merchant destination.

## Price integrity rules
- A crossed-out price or seller-provided MRP does not prove an authentic discount.
- Each observation stores price, currency, source label, source URL, source type and timestamp.
- The current UI requires at least five observations across at least seven days before it emits a stronger 30-day median comparison signal.
- The displayed signal is descriptive of stored observations; it is not a promise about the live checkout price.
- Never state “lowest ever”, “best price” or “genuine discount” unless the relevant time window, data completeness and source policy justify that statement.

## User watchlist and alerts
- User can sign in, save a published product and store one target price per product.
- Database table `price_alerts` stores an enabled target and last-notified timestamp.
- Automatic price ingestion and notification dispatch are not enabled in this starter release. They require an approved price source, scheduler/Edge Function, notification provider, retry controls and user opt-in.

## Admin workflow
- Project owner grants an admin/editor role in SQL; browser users cannot self-assign roles.
- Admin creates or reuses a merchant, creates/reuses a product if applicable, adds a dated observation, and publishes a deal or coupon.
- Source label and evidence URL are required by the UI before publishing.
- Public users can read active offers only. Admin/editor policies govern writes.

## Release stages
### Starter PWA
- Responsive Next.js pages, PWA manifest, service worker/offline fallback, demo states, Supabase Auth, database-backed deal/coupon feed, admin publishing and watchlist.
### Data operations
- Approved affiliate feeds or official APIs, scheduled ingestion, deduplication, source monitoring, stale-offer expiry and price history completeness checks.
### Notifications
- Supabase Edge Function + scheduler, user notification preferences, email/push delivery, opt-out and delivery logs.
### Growth and monetisation
- Approved affiliate programme links, transparent disclosure, click analytics, deal alerts, SEO landing pages and editorial curation.

## Non-goals for initial release
- Unapproved scraping of Amazon, Flipkart, Swiggy, Zomato or other merchant platforms.
- Claims that sample data represents live prices.
- Guaranteed savings or guaranteed alert delivery before ingestion and notification infrastructure is deployed.


## MVP scope freeze (20 Nov 2026)

The first release is limited to the PWA experience, manually reviewed source-backed listings, Supabase email authentication, watchlists, recorded price history, admin publishing and legal/trust pages. Amazon, Flipkart, Awin, Rakuten, ONDC and other marketplace connectors are post-MVP work. Do not request or configure retailer API credentials before the core website is deployed and validated.
