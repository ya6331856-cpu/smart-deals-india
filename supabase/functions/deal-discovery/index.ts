import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const iso = (v: unknown): string | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = typeof v === "number" ? new Date(v) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const hash = async (v: string) => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const affiliateId = Deno.env.get("FLIPKART_AFFILIATE_ID");
  const affiliateToken = Deno.env.get("FLIPKART_AFFILIATE_TOKEN");
  const syncSecret = Deno.env.get("SMART_DEALS_SYNC_SECRET");
  if (!url || !serviceKey) return json({ error: "Server configuration missing" }, 500);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const suppliedSecret = req.headers.get("x-sync-secret") ?? "";
  const scheduled = Boolean(syncSecret && suppliedSecret && suppliedSecret === syncSecret);
  if (!scheduled) {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth.trim();
    if (!token) return json({ error: "Admin sign-in or scheduled sync secret required" }, 401);
    const { data: userData, error: authError } = await db.auth.getUser(token);
    if (authError || !userData.user) return json({ error: "Valid sign-in required" }, 401);
    const { data: admin } = await db.from("admin_users").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (!admin || !["admin", "editor"].includes(admin.role)) return json({ error: "Admin/editor access required" }, 403);
  }

  const { data: sources } = await db.from("deal_discovery_sources")
    .select("source_key,display_name,integration_status,is_enabled")
    .order("display_name");
  const source = (sources ?? []).find((s) => s.source_key === "flipkart");
  if (!source?.is_enabled) return json({ status: "source_paused", sources });
  if (!affiliateId || !affiliateToken) {
    await db.from("deal_discovery_sources").update({
      integration_status: "credentials_required",
      last_checked_at: new Date().toISOString(),
      last_error: "Flipkart affiliate credentials are not configured",
    }).eq("source_key", "flipkart");
    return json({ status: "needs_credentials", requiredSecrets: ["FLIPKART_AFFILIATE_ID", "FLIPKART_AFFILIATE_TOKEN"], sources });
  }

  const started = new Date().toISOString();
  const { data: run } = await db.from("deal_discovery_runs")
    .insert({ source_key: "flipkart", run_status: "running", started_at: started })
    .select("id").single();

  try {
    const response = await fetch("https://affiliate-api.flipkart.net/affiliate/offers/v1/all/json", {
      headers: { "Fk-Affiliate-Id": affiliateId, "Fk-Affiliate-Token": affiliateToken, "Accept": "application/json" },
    });
    if (!response.ok) throw new Error(`Flipkart feed returned HTTP ${response.status}`);
    const payload = await response.json();
    const offers = Array.isArray(payload?.allOffersList) ? payload.allOffersList : [];
    const now = Date.now();
    const { data: merchant, error: merchantError } = await db.from("merchants").upsert({
      name: "Flipkart", slug: "flipkart", website_url: "https://www.flipkart.com", merchant_type: "retail", is_active: true,
    }, { onConflict: "slug" }).select("id").single();
    if (merchantError || !merchant) throw new Error("Could not prepare Flipkart merchant");

    let published = 0, review = 0, normalized = 0;
    for (const item of offers) {
      if (!item || typeof item.title !== "string" || typeof item.url !== "string") continue;
      let productUrl: URL;
      try { productUrl = new URL(item.url); } catch { continue; }
      if (productUrl.protocol !== "https:" || !/(^|\.)flipkart\.com$/i.test(productUrl.hostname)) continue;

      const startsAt = iso(item.startTime);
      const endsAt = iso(item.endTime);
      const feedWindowActive = item.availability === "LIVE" && Boolean(startsAt && endsAt)
        && new Date(startsAt!).getTime() <= now && new Date(endsAt!).getTime() > now;
      // The affiliate offers feed confirms that an offer exists, but does not
      // verify the exact product/variant price or customer eligibility.
      // Keep it in review until those independent checks are implemented.
      const externalId = await hash(item.url);
      const categoryText = String(item.category ?? "").toLowerCase();
      const category = categoryText.includes("food") ? "food"
        : categoryText.includes("travel") ? "travel"
        : categoryText.includes("bill") ? "bills" : "shopping";
      const title = item.title.trim().slice(0, 250);
      const raw = {
        title, description: String(item.description ?? "").slice(0, 2500),
        category: item.category ?? null, availability: item.availability ?? null,
        startTime: item.startTime ?? null, endTime: item.endTime ?? null, url: item.url,
      };

      const { data: deal, error: dealError } = await db.from("deals").upsert({
        source_external_id: `flipkart:${externalId}`,
        merchant_id: merchant.id,
        title,
        description: String(item.description ?? "Offer listed in the official Flipkart affiliate feed. Check seller, coupon and checkout terms.").slice(0, 3000),
        category, offer_type: "limited_offer", offer_price: null, original_price: null,
        discount_label: "Flipkart offer",
        trust_label: "Official affiliate feed · product price/history not verified",
        source_label: "Flipkart Affiliate Offers API",
        source_url: "https://affiliate.flipkart.com/",
        affiliate_url: item.url,
        status: "draft",
        starts_at: startsAt ?? started,
        ends_at: endsAt ?? new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "source_external_id" }).select("id").single();
      if (dealError || !deal) throw new Error(dealError?.message ?? "Deal upsert failed");

      const { error: queueError } = await db.from("deal_discovery_items").upsert({
        source_key: "flipkart", external_id: externalId, content_hash: externalId, title,
        product_url: item.url, offer_price: null, original_price: null,
        starts_at: startsAt, ends_at: endsAt, source_verified: true,
        product_match_verified: false, eligibility_verified: false,
        confidence_score: feedWindowActive ? 40 : 25, review_status: "pending",
        deal_id: deal.id, raw_payload: raw, last_seen_at: started, updated_at: started,
      }, { onConflict: "source_key,external_id" });
      if (queueError) throw new Error(queueError.message);
      normalized++;
      review++;
    }

    const finished = new Date().toISOString();
    await db.from("deal_discovery_runs").update({
      run_status: review ? "partial" : "success", fetched_count: offers.length,
      normalized_count: normalized, published_count: published, review_count: review, finished_at: finished,
    }).eq("id", run?.id);
    await db.from("deal_discovery_sources").update({
      integration_status: "connected", last_checked_at: finished, last_success_at: finished, last_error: null,
    }).eq("source_key", "flipkart");

    return json({
      status: "success", fetched: offers.length, normalized, autoPublished: published, sentToReview: review,
      note: "Official feed presence and offer window are recorded, but no item is auto-published until exact product/variant price and eligibility are independently verified.",
      connectedSources: ["flipkart"],
      awaitingConnection: (sources ?? []).filter((s) => s.source_key !== "flipkart").map((s) => s.display_name),
      checkedAt: finished,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown source error";
    const finished = new Date().toISOString();
    await db.from("deal_discovery_runs").update({ run_status: "failed", error_message: message, finished_at: finished }).eq("id", run?.id);
    await db.from("deal_discovery_sources").update({ integration_status: "error", last_checked_at: finished, last_error: message }).eq("source_key", "flipkart");
    return json({ status: "failed", error: message }, 502);
  }
});