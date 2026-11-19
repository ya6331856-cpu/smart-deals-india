# India Marketplace Coverage — Connector Blueprint

This document defines how Smart Deals India can expand from the current Flipkart offers connector into a multi-source product and price tracker.

## Important coverage limit

There is no single public API that exposes every product, seller, live checkout price, delivery charge, stock status, bank discount and coupon across every Indian shopping or quick-commerce app. Access is controlled by each retailer, affiliate program or network. Some prices depend on the delivery PIN code, seller, product variant, login state, cart quantity, payment card and time.

The product should therefore use approved APIs, affiliate product feeds, merchant-authorised feeds and ONDC participation. Do not build on hidden mobile-app endpoints, session cookies, CAPTCHA bypasses or scraping that violates platform terms.

## Source coverage and onboarding

| Source / route | What it can contribute | Access needed | Project status |
|---|---|---|---|
| Amazon India Creators API | Product search, item details, variations and available offer/listing data | Amazon Associates account for India, Creators API approval, Partner Tag, Client ID and Client Secret | Not connected |
| Flipkart Affiliate APIs | Product feeds/search/lookups and active offers | Flipkart Affiliate account, Affiliate Tracking ID and Affiliate API Token | Offers Edge Function deployed; secrets and scheduled sync still need owner setup. Product price-feed ingestion is a separate next step |
| Awin product feeds | Product catalog feeds with product name, price, discount, shipping, image and deep link for approved advertisers | Awin publisher account, approval from individual advertisers, Product Feed API key / feed access | Candidate network; verify Indian advertiser coverage in account |
| Rakuten Advertising APIs | Product Search, Offers, Coupon Feed and related affiliate data where advertiser access is approved | Publisher account, advertiser partnerships, Developer Portal token(s) | Candidate network; verify India programs and feed scope |
| ONDC | Search/catalog discovery across participating network sellers in supported domains such as grocery, food, electronics, fashion, home and beauty | Join as a Buyer Network Participant, complete onboarding/certification and implement the ONDC protocol, registry and signing requirements | Strategic phase; not a normal API-key integration |
| Other retailer / quick-commerce apps (for example Myntra, AJIO, Nykaa, Croma, Reliance Digital, Tata CLiQ, JioMart, BigBasket, Blinkit, Zepto and Swiggy Instamart) | Potential merchant-specific catalog, price or promotion data | A published API/feed or written partner approval from that company / its affiliate network | No blanket public API access assumed; investigate one partner at a time |
| Bank and brand promotion sources | Card offers, coupon campaigns and terms | Official campaign feed/API or manual evidence-backed editorial review | Existing manual source workflow |

### Official links

- Amazon India Associates: https://affiliate-program.amazon.in/
- Amazon Creators API introduction: https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction
- Amazon Creators API onboarding: https://affiliate-program.amazon.in/creatorsapi/docs/en-us/onboarding/sign-up-as-an-amazon-associate
- Amazon Creators API reference: https://affiliate-program.amazon.in/creatorsapi/docs/en-us/api-reference
- Flipkart Affiliate registration: https://affiliate.flipkart.com/registerme
- Flipkart API documentation: https://affiliate.flipkart.com/api-docs/affiliate_index.html
- Flipkart API registration/token instructions: https://affiliate.flipkart.com/api-docs/af_register.html
- Awin publisher developer/product-feed guide: https://help.awin.com/developers/docs/product-feed-publisher-guide-intro
- Awin product-feed access guide: https://success.awin.com/s/article/How-can-I-access-a-Product-Feed?language=en_US
- Rakuten developer portal: https://developers.rakutenadvertising.com/
- Rakuten publisher help / API list: https://pubhelp.rakutenadvertising.com/hc/en-us/articles/5949692220813-Developer-Portal-Overview
- ONDC participant technical resources: https://resources.ondc.org/tech-resources
- ONDC buyer network participant onboarding: https://ondc.org/pages/buyer-network-participants.html
- ONDC developer workbench: https://workbench.ondc.tech/developer-guide

## Credential inventory

Add only credentials for a source after the account is approved. Store values in **Supabase Dashboard → Edge Functions → Secrets** (or the matching secure secret manager). Do not place them in `NEXT_PUBLIC_*`, browser code, GitHub, screenshots, chat messages, or the ZIP archive.

### Existing Flipkart offer connector

- `FLIPKART_AFFILIATE_ID` — Affiliate Tracking ID from Flipkart Affiliate account.
- `FLIPKART_AFFILIATE_TOKEN` — API Token generated in Flipkart Affiliate dashboard.
- `SMART_DEALS_SYNC_SECRET` — a long random secret used by scheduled/manual sync calls.

The current deployed function imports Flipkart offers. It does **not** yet establish a complete multi-retailer price-history feed. A separate product-feed/price-observation importer is required for the price tracker.

### Amazon India (when eligible)

- `AMAZON_IN_CLIENT_ID` — Creators API Client ID.
- `AMAZON_IN_CLIENT_SECRET` — Creators API Client Secret.
- `AMAZON_IN_PARTNER_TAG` — India Associates Partner Tag.
- `AMAZON_IN_CREDENTIAL_VERSION` — version value supplied by the Creators API onboarding flow.

The OAuth access token is short-lived and should be generated by the backend when needed; do not hard-code or save a copied access token. Amazon's current onboarding documentation states that Creators API access requires Associates enrollment and at least 10 qualifying sales in the previous 30 days, followed by API registration/approval.

### Awin (only if approved advertiser feeds exist)

- `AWIN_PUBLISHER_ID` — publisher account identifier.
- `AWIN_PRODUCT_FEED_API_KEY` — product-feed download key from Awin Toolbox → Create-a-Feed.
- `AWIN_PUBLISHER_API_TOKEN` — only if using an Awin API endpoint that requires the publisher bearer token.

Awin's product-feed key and Publisher API token are different credentials. Only feeds made available to the approved publisher account should be imported.

### Rakuten Advertising (only if approved advertiser programs exist)

- `RAKUTEN_PUBLISHER_ID` — publisher identifier.
- `RAKUTEN_WEBSERVICES_TOKEN` or `RAKUTEN_SECURITY_TOKEN` — use the specific token type required by the selected API in the Rakuten Developer Portal.

Do not assume one token works for every Rakuten API; follow the selected endpoint's current authentication guide.

### ONDC Buyer Network Participant (future strategic integration)

- `ONDC_SUBSCRIBER_ID` — registered participant subscriber ID.
- `ONDC_UNIQUE_KEY_ID` — key identifier registered for the participant.
- `ONDC_PRIVATE_KEY` — private signing key; highly sensitive, never commit or expose.
- `ONDC_ENVIRONMENT` — approved environment/registry configuration.

ONDC onboarding and protocol compliance are required; these values are not a substitute for registry subscription, testing or certification.

### Notifications (only when push alerts are implemented)

- `WEB_PUSH_VAPID_PRIVATE_KEY` — server-only Web Push private key.
- `WEB_PUSH_SUBJECT` — `mailto:` or approved contact URI used by the Web Push library.
- `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` — public key only; safe to expose to the browser by design.
- `RESEND_API_KEY` — optional, only if email alerts are enabled through Resend.

`SUPABASE_SERVICE_ROLE_KEY` must remain server-side / Edge Function-only. Never prefix it with `NEXT_PUBLIC_`.

## How the multi-platform tracker should work

1. **Connector adapters:** one backend adapter per approved source (Amazon, Flipkart, Awin, Rakuten, ONDC, and any directly approved retailer). Each adapter handles that provider's authentication, pagination, rate limits, retries and terms.
2. **Canonical product matching:** match first by GTIN/EAN/UPC/ISBN when available, then brand + model + exact variant. Keep platform identifiers (ASIN, FSN, seller SKU, source product ID) as separate references. Do not merge different size, colour, storage, pack-size or model variants.
3. **Seller-specific listing:** one canonical product can have separate listings for Amazon, Flipkart and other merchants. Store each seller's URL, seller SKU, stock/availability and last-seen timestamp separately.
4. **Price observations:** append a new timestamped INR observation for every permitted source update. Preserve source label, source record/URL, merchant, delivery PIN code/region when available, and run ID. Do not overwrite old observations.
5. **Landed-price calculation:** keep item price, shipping, platform coupon, bank/card offer, cashback and membership benefit as separate fields. Show a final payable estimate only when the source has enough information; clearly state eligibility and PIN-code assumptions.
6. **Deal/price-drop detection:** compare a new observation with the same exact product variant and seller's history. Apply minimum thresholds, ignore invalid/outlier values, expire old offers and deduplicate repeated alerts.
7. **User alerts:** evaluate each user's target price after ingestion. Write one alert event, then send opt-in Web Push/email. The app can refresh its deal feed from Supabase; an alert should not be described as instant until the source's update cadence and push delivery are proven.
8. **Operations:** maintain per-source sync logs, last successful sync, stale-feed warnings, quota/error monitoring and a kill switch for a connector that starts failing.

## Cadence and honesty

- Use a provider webhook/event when the provider explicitly offers one.
- Otherwise poll only as often as that provider's terms, quota and feed update schedule allow. A 15–30 minute schedule is a target for suitable feeds, not a promise that every retailer changes its data that frequently.
- Daily/periodic product feeds are still useful but cannot produce second-by-second alerts.
- The current discount indicator requires at least five observations spanning at least seven days. It is a comparison against our collected history, not proof of an all-time low or an authentic MRP.
- Always show source and last checked time. For PIN-code-based services, show the selected PIN code or mark delivery price as unverified.

## What the platform must not claim

- It cannot honestly promise “every product in India” until every relevant seller source has granted data access and the catalog has been measured for coverage.
- It cannot promise instant detection from a provider that only supplies periodic feeds.
- It must not present a bank-card offer as a universal price drop.
- It must not silently use hidden app endpoints, copied session cookies or unauthorized scraping as a substitute for an API agreement.

## Suggested rollout

1. Finish Flipkart credentials and scheduled offer sync; add a separate authorized product feed → `price_observations` importer.
2. Apply for Amazon India Associates and Creators API when the qualifying-sales requirement is met.
3. Join Awin/Rakuten as a publisher and inspect the Indian merchant/advertiser catalog actually available to the account.
4. Request direct catalog/price partnership from retailers and quick-commerce companies absent from approved feeds.
5. Evaluate ONDC Buyer Network Participant onboarding for supported network categories.
6. Add push notifications after price ingestion and alert deduplication are working reliably.
