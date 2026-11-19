import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function toIso(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value); // Flipkart documents Unix milliseconds.
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const affiliateId = Deno.env.get("FLIPKART_AFFILIATE_ID");
  const affiliateToken = Deno.env.get("FLIPKART_AFFILIATE_TOKEN");
  const syncSecret = Deno.env.get("SMART_DEALS_SYNC_SECRET");
  if (!supabaseUrl || !serviceKey) return reply({ error: "Supabase server configuration is missing." }, 500);
  if (!affiliateId || !affiliateToken) {
    return reply({ status: "needs_credentials", requiredSecrets: ["FLIPKART_AFFILIATE_ID", "FLIPKART_AFFILIATE_TOKEN"] });
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const suppliedSyncSecret = req.headers.get("x-sync-secret") ?? "";
  const scheduledCall = Boolean(syncSecret && suppliedSyncSecret && suppliedSyncSecret === syncSecret);

  if (!scheduledCall) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();
    if (!token) return reply({ error: "Admin sign-in or valid scheduled sync secret required." }, 401);
    const { data: authData, error: authError } = await db.auth.getUser(token);
    if (authError || !authData.user) return reply({ error: "Valid sign-in required." }, 401);
    const { data: role, error: roleError } = await db
      .from("admin_users").select("role").eq("user_id", authData.user.id).maybeSingle();
    if (roleError || !role || !["admin", "editor"].includes(role.role)) {
      return reply({ error: "Admin/editor access required." }, 403);
    }
  }

  const upstream = await fetch("https://affiliate-api.flipkart.net/affiliate/offers/v1/all/json", {
    headers: {
      "Fk-Affiliate-Id": affiliateId,
      "Fk-Affiliate-Token": affiliateToken,
      "Accept": "application/json",
    },
  });
  if (!upstream.ok) {
    return reply({ error: "Flipkart feed request failed.", upstreamStatus: upstream.status,
      detail: (await upstream.text()).slice(0, 400) }, 502);
  }

  const payload = await upstream.json();
  const offers = Array.isArray(payload?.allOffersList) ? payload.allOffersList : [];
  if (!offers.length) return reply({ status: "no_offers", fetched: 0 });

  const { data: merchant, error: merchantError } = await db.from("merchants").upsert({
    name: "Flipkart", slug: "flipkart", website_url: "https://www.flipkart.com",
    merchant_type: "retail", is_active: true,
  }, { onConflict: "slug" }).select("id").single();
  if (merchantError || !merchant) return reply({ error: "Could not prepare Flipkart merchant." }, 500);

  const now = Date.now();
  const rows = [];
  for (const item of offers) {
    if (!item || typeof item.title !== "string" || typeof item.url !== "string") continue;
    const startsAt = toIso(item.startTime) ?? new Date(now).toISOString();
    const endsAt = toIso(item.endTime);
    if (!endsAt || new Date(endsAt).getTime() <= now) continue;
    const active = item.availability === "LIVE" && new Date(startsAt).getTime() <= now;
    const categoryText = String(item.category ?? "").toLowerCase();
    const category = categoryText.includes("food") ? "food"
      : categoryText.includes("travel") ? "travel"
      : categoryText.includes("bill") ? "bills" : "shopping";
    rows.push({
      source_external_id: "flipkart:" + await sha256(item.url),
      merchant_id: merchant.id,
      title: item.title.slice(0, 250),
      description: String(item.description ?? "Offer from Flipkart Affiliate API. Check seller and checkout terms.").slice(0, 3000),
      category,
      offer_type: "limited_offer",
      offer_price: null,
      original_price: null,
      discount_label: "Flipkart offer",
      trust_label: "Official affiliate feed · price history not verified",
      source_label: "Flipkart Affiliate Offers API",
      source_url: "https://affiliate.flipkart.com/api-docs/af_offer_ref.html",
      affiliate_url: item.url,
      status: active ? "active" : "pending",
      starts_at: startsAt,
      ends_at: endsAt,
    });
  }

  if (!rows.length) return reply({ status: "no_current_offers", fetched: offers.length, importedOrUpdated: 0 });
  const { data: saved, error: saveError } = await db.from("deals")
    .upsert(rows, { onConflict: "source_external_id" }).select("id,status");
  if (saveError) return reply({ error: "Could not save offers.", detail: saveError.message }, 500);
  const activeCount = (saved ?? []).filter((row: { status: string }) => row.status === "active").length;
  return reply({
    status: "success", fetched: offers.length, importedOrUpdated: saved?.length ?? 0,
    active: activeCount, pending: (saved?.length ?? 0) - activeCount,
    source: "Flipkart Affiliate Offers API", checkedAt: new Date().toISOString(),
  });
});
