# Data Integration Plan

## Accepted source types
1. Official merchant APIs.
2. Approved affiliate network feeds / APIs where programme terms permit display and price updates.
3. Merchant-provided CSV or feed with permission.
4. Manual admin entry that records a source label, evidence URL and observed timestamp.

## Ingestion contract
Every price observation should include:
- stable product and merchant identifiers;
- amount and currency;
- observed timestamp (UTC in storage; localise for display);
- source type and source label;
- source URL or feed record reference;
- fetch/import status and ingestion run identifier for automated sources.

## Validation
- Reject invalid or negative prices.
- Normalise merchant SKU / URL identifiers before inserting duplicate products.
- Store observations rather than overwriting history.
- Mark observations stale after a source-specific freshness window.
- Keep bank eligibility, minimum order, location, payment method and expiry conditions in offer descriptions/terms.
- Never infer a coupon is valid solely because a code is present.

## Discount signal (initial conservative heuristic)
- Fewer than five price observations or fewer than seven days covered: “Not enough history to judge this price”.
- Otherwise compare latest observation with the median of observations in the tracked 30-day window.
- Below 90% of the median: “Below tracked 30-day median”.
- Above 105% of the median: “Above recent 30-day median”.
- Otherwise: “Close to tracked 30-day median”.

This is a first-pass indicator, not proof that an advertised MRP is authentic or that an item has reached its all-time low. Larger-scale launch should add outlier handling, observation cadence, currency/variant matching and source confidence scoring.

## Automation not yet enabled
Do not turn on scheduled fetches until the user has an approved feed/API and any required credentials. Store those credentials only in Supabase Edge Function secrets, never in browser variables or Git.
