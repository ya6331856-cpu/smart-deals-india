# Real offer data setup

## Already live in the Mumbai database
Three bank promotions were manually reviewed and inserted from ICICI Bank's official Festive Bonanza page on 20 Nov 2026:
- Zomato: 5% off on food delivery orders above ₹299, Amazon Pay ICICI Bank Credit Card, listed validity through 30 Nov 2026.
- Swiggy: 5% off on food delivery orders above ₹299, Amazon Pay ICICI Bank Credit Card, listed validity through 30 Nov 2026.
- OnePlus: up to ₹4,000 off on select products with eligible ICICI Bank cards / credit-card EMI, listed validity through 30 Nov 2026.

Source and terms: https://www.icici.bank.in/campaigns/bonanza/index
These are bank offers, not universal coupons. Eligibility and final availability must be checked at checkout. Recheck the source before extending expiry.

## Flipkart feed connector
A Supabase Edge Function is deployed as `sync-flipkart-offers`. It reads Flipkart's documented active-offers API, stores offer start/end dates, and uses a stable source hash to update rather than duplicate rows. The `deal-discovery` pipeline records official-feed offers as pending review; it does not auto-publish them because the feed alone does not independently verify the exact product/variant price or customer eligibility. No product price or historical discount is invented. Flipkart currently shows `credentials_required` because the affiliate account/API credentials have not been connected.

Official docs: https://affiliate.flipkart.com/api-docs/af_offer_ref.html

Before it can run, the project owner must:
1. Join / activate the Flipkart Affiliate Program and obtain an Affiliate Tracking ID and API Token.
2. In Supabase Dashboard → Edge Functions → Secrets, add:
   - `FLIPKART_AFFILIATE_ID`
   - `FLIPKART_AFFILIATE_TOKEN`
   - `SMART_DEALS_SYNC_SECRET` (generate a long random secret; do not share it in chat or GitHub).
3. In Supabase SQL Editor, save the project URL and the same sync secret in Vault using `vault.create_secret`, with names `smart_deals_project_url` and `smart_deals_sync_secret`.
4. Run `supabase/cron/sync-flipkart-offers.sql` to refresh the feed every 30 minutes.
5. Check Edge Function logs and the `deals` table after the first run.

Do not put Affiliate ID/token, Supabase service-role key, or sync secret in `NEXT_PUBLIC_*` variables or GitHub.

## Publishing safety
Offers from a source feed are not automatically treated as verified deals. The discovery pipeline keeps items in the review queue until exact product/variant price and customer eligibility have independent evidence. Only then should the publishing rules be expanded to auto-publish. This follows the selected policy: publish all eligible verified deals, review uncertain items.

## Amazon product data
Amazon's Creators API is the current successor to PA-API 5.0. Amazon's official onboarding page says the account must be enrolled in Associates, have at least 10 qualifying sales in the past 30 days for API access, register for API access, and generate credentials. Until eligible, use reviewed public bank/merchant offers or links generated in Associates Central; do not scrape product pages.
Official docs: https://affiliate-program.amazon.in/creatorsapi/docs/en-us/introduction

## Food offers
The first real food listings are bank-funded promotions. Zomato/Swiggy live menus, cart discounts and user-specific coupons are not assumed to be publicly accessible APIs. Add them only from official bank/brand pages or an approved coupon/affiliate provider, with payment eligibility, minimum order, expiry and source recorded.

## Admin publishing
Sign in once with the intended admin email. Then run in Supabase SQL Editor:

```sql
insert into public.admin_users (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_LOGIN_EMAIL'
on conflict (user_id) do update set role = excluded.role;
```

## Scheduling notes
Supabase Cron + pg_net can call Edge Functions on a schedule. The SQL template uses Supabase Vault to avoid putting the sync secret directly into a scheduled SQL command. See https://supabase.com/docs/guides/functions/schedule-functions.
