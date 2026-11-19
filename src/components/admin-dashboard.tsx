"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminRow = { id: string; title: string; status: string; ends_at: string; created_at: string; kind: "deal" | "coupon"; merchantName: string };
type AccessState = "checking" | "unconfigured" | "signed-out" | "not-admin" | "ready";
const categories = ["shopping", "food", "travel", "bills"] as const;
const dealTypes = ["price_drop", "bank_offer", "bundle", "cashback", "limited_offer"] as const;
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `item-${Date.now()}`; }
function safeUrl(value: string) {
  if (!value.trim()) return null;
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http/https links are allowed.");
  return url.toString();
}

export function AdminDashboard() {
  const [access, setAccess] = useState<AccessState>("checking");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [listingKind, setListingKind] = useState<"deal" | "coupon">("deal");
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("shopping");
  const [dealType, setDealType] = useState<(typeof dealTypes)[number]>("price_drop");
  const [merchant, setMerchant] = useState(""); const [productName, setProductName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [productUrl, setProductUrl] = useState(""); const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState(""); const [affiliateUrl, setAffiliateUrl] = useState("");
  const [offerPrice, setOfferPrice] = useState(""); const [originalPrice, setOriginalPrice] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const client = getSupabaseBrowserClient();

  const loadRows = useCallback(async () => {
    if (!client) return;
    const [dealResult, couponResult] = await Promise.all([
      client.from("deals").select("id,title,status,ends_at,created_at,merchants(name)").order("created_at", { ascending: false }).limit(30),
      client.from("coupons").select("id,title,status,ends_at,created_at,merchants(name)").order("created_at", { ascending: false }).limit(30),
    ]);
    if (dealResult.error && couponResult.error) { setMessage(`Could not load latest listings: ${dealResult.error.message}`); return; }
    const deals = (dealResult.data ?? []).map((row: any) => ({ id: String(row.id), title: row.title, status: row.status, ends_at: row.ends_at, kind: "deal" as const, merchantName: row.merchants?.name ?? "Merchant", created_at: row.created_at }));
    const coupons = (couponResult.data ?? []).map((row: any) => ({ id: String(row.id), title: row.title, status: row.status, ends_at: row.ends_at, kind: "coupon" as const, merchantName: row.merchants?.name ?? "Merchant", created_at: row.created_at }));
    setRows([...deals, ...coupons].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30));
  }, [client]);

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      if (!client) { if (!cancelled) setAccess("unconfigured"); return; }
      const { data: { user }, error } = await client.auth.getUser();
      if (cancelled) return;
      if (error || !user) { setAccess("signed-out"); return; }
      setUserId(user.id);
      const { data, error: roleError } = await client.from("admin_users").select("role").eq("user_id", user.id).maybeSingle();
      if (cancelled) return;
      if (roleError || !data) { setAccess("not-admin"); return; }
      setRole(data.role); setAccess("ready");
      await loadRows();
    }
    void checkAccess();
    return () => { cancelled = true; };
  }, [client, loadRows]);


  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (!client || !userId) { setMessage("Sign in with an authorised admin account first."); return; }
    if (!title.trim() || !merchant.trim() || !sourceLabel.trim() || !sourceUrl.trim()) { setMessage("Fill in the listing title, merchant, source label and source evidence URL."); return; }
    if (listingKind === "deal" && !productName.trim()) { setMessage("A product or service name is required for a price deal."); return; }
    const offer = offerPrice.trim() ? Number(offerPrice) : null;
    const original = originalPrice.trim() ? Number(originalPrice) : null;
    const days = Number(expiryDays);
    if (listingKind === "deal" && ((offer !== null && (!Number.isFinite(offer) || offer < 0)) || (original !== null && (!Number.isFinite(original) || original < 0)))) { setMessage("Enter valid prices, or leave them blank for offer-only listings."); return; }
    if (!Number.isInteger(days) || days < 1 || days > 90) { setMessage("Listing duration must be between 1 and 90 days."); return; }
    

    setBusy(true);
    try {
      const cleanProductUrl = safeUrl(productUrl);
      const cleanSourceUrl = safeUrl(sourceUrl);
      const cleanAffiliateUrl = safeUrl(affiliateUrl);
      const merchantSite = cleanProductUrl ? new URL(cleanProductUrl).origin : null;
      const merchantSlug = slugify(merchant);
      const { data: merchantRow, error: merchantError } = await client.from("merchants").upsert({ name: merchant.trim(), slug: merchantSlug, website_url: merchantSite, merchant_type: category === "food" ? "food" : "retail", is_active: true }, { onConflict: "slug" }).select("id").single();
      if (merchantError) throw merchantError;
      const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      if (listingKind === "coupon") {
        const { error } = await client.from("coupons").insert({ merchant_id: merchantRow.id, title: title.trim(), code: couponCode.trim(), description: description.trim() || null, category, source_label: sourceLabel.trim(), source_url: cleanSourceUrl, terms_url: cleanProductUrl, status: "active", starts_at: now, ends_at: endsAt });
        if (error) throw error;
        setMessage("Coupon published. Its source and validity are saved; users should still check merchant terms at checkout.");
      } else {
        const productSlug = slugify(`${merchant}-${productName}`);
        const { data: productRow, error: productError } = await client.from("products").upsert({ merchant_id: merchantRow.id, name: productName.trim(), slug: productSlug, product_url: cleanProductUrl, category, status: "published" }, { onConflict: "slug" }).select("id").single();
        if (productError) throw productError;
        if (offer !== null) {
          const { error: observationError } = await client.from("price_observations").insert({ product_id: productRow.id, merchant_id: merchantRow.id, price: offer, source_label: sourceLabel.trim(), source_url: cleanSourceUrl, observed_at: now, source_type: "manual" });
          if (observationError) throw observationError;
        }
        const percent = offer !== null && original !== null && original > offer ? Math.round((1 - offer / original) * 100) : null;
        const { error: dealError } = await client.from("deals").insert({ product_id: productRow.id, merchant_id: merchantRow.id, title: title.trim(), description: description.trim() || null, category, offer_type: dealType, offer_price: offer, original_price: original, discount_label: percent === null ? null : `${percent}% below listed reference price`, trust_label: offer === null ? "Source recorded · price history pending" : "1 price observation · not enough history to verify a discount", source_label: sourceLabel.trim(), source_url: cleanSourceUrl, affiliate_url: cleanAffiliateUrl, status: "active", starts_at: now, ends_at: endsAt });
        if (dealError) throw dealError;
        setMessage("Deal published. Its single price observation is not labelled as a verified discount.");
      }
      setTitle(""); setDescription(""); setProductName(""); setCouponCode(""); setProductUrl(""); setSourceLabel(""); setSourceUrl(""); setAffiliateUrl(""); setOfferPrice(""); setOriginalPrice("");
      await loadRows();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish this listing. Check the fields and permissions.");
    } finally { setBusy(false); }
  }

  if (access !== "ready") {
    const messages: Record<Exclude<AccessState, "ready">, string> = {
      checking: "Checking account permissions…",
      unconfigured: "Supabase is not configured. Add the project URL and publishable key to the app environment.",
      "signed-out": "Sign in first using the same email that was granted admin access.",
      "not-admin": "This account does not have admin or editor access yet. Only the project owner can grant that role.",
    };
    return <div className="admin-guard"><strong>Admin access required</strong><p>{messages[access]}</p><a className="text-link" href="/login">Go to sign in →</a></div>;
  }

  return <div className="admin-layout">
    <div className="admin-topline"><div><span className="panel-kicker">SIGNED IN · {role.toUpperCase()}</span><p>Only authorised editors can publish offers. Public users cannot edit listings or source records.</p></div><div className="admin-top-actions"><button className="small-outline-button" type="button" onClick={() => client?.auth.signOut()}>Sign out</button></div></div>
    <form className="admin-form" onSubmit={createListing}>
      <div className="admin-form-heading"><span className="panel-kicker">NEW LISTING</span><h2>Put a fresh find on the radar.</h2><p>Record where it came from and how long it is valid. A listed reference price is not the same as verified historical savings.</p></div>
      <div className="admin-fields">
        <label>Listing type<select value={listingKind} onChange={(e) => setListingKind(e.target.value as "deal" | "coupon")}><option value="deal">Product / service deal</option><option value="coupon">Food / shopping coupon</option></select></label>
        <label>Category<select value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Listing title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Weekend kitchen offer" /></label>
        <label>Merchant / brand<input required value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant name" /></label>
        {listingKind === "deal" ? <>
          <label>Product / service name<input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name" /></label>
          <label>Offer type<select value={dealType} onChange={(e) => setDealType(e.target.value as typeof dealType)}>{dealTypes.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}</select></label>
          <label>Current offer price (₹)<input type="number" min="0" step="0.01" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="Leave blank for coupon-style offer" /></label>
          <label>Listed reference price (₹)<input type="number" min="0" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Optional" /></label>
        </> : <label>Coupon code (optional for bank offers)<input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Example: SAVE20" /></label>}
        <label>{listingKind === "coupon" ? "Merchant terms URL" : "Product URL"}<input type="url" value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://merchant.example/offer" /></label>
        <label>Offer source label<input required value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} placeholder="Official merchant page / approved feed" /></label>
        <label>Source evidence URL<input required type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://source.example/offer" /></label>
        {listingKind === "deal" && <label>Affiliate URL (optional)<input type="url" value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} placeholder="Approved affiliate link" /></label>}
        <label>Listing validity (days)<input type="number" min="1" max="90" step="1" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} /></label>
        <label className="wide-field">Description / conditions<textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Minimum spend, eligible bank cards, exclusions, locations and other terms" /></label>
      </div>
      <button className="primary-button admin-submit" type="submit" disabled={busy}>{busy ? "Publishing…" : `Publish ${listingKind}`} <span>↗</span></button>
      {message && <p className="admin-message" role="status">{message}</p>}
    </form>
    <section className="admin-list"><div className="admin-form-heading"><span className="panel-kicker">RECENT ACTIVITY</span><h2>Latest listings</h2></div>{rows.length ? <div className="admin-table">{rows.map((row) => <div className="admin-table-row" key={`${row.kind}-${row.id}`}><div><strong>{row.title}</strong><small>{row.merchantName} · {row.kind}</small></div><span className={`status-tag status-${row.status}`}>{row.status}</span><time>{new Date(row.ends_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></div>)}</div> : <p className="empty-admin">No offers or coupons have been published yet.</p>}</section>
  </div>;
}
