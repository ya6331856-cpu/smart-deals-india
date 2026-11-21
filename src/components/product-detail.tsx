"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Product = { id: string; name: string; slug: string; brand: string | null; image_url: string | null; product_url: string | null; category: string | null };
type Listing = { id: string; source_key: string; seller_name: string | null; listing_url: string | null; affiliate_url: string | null; availability_status: string; item_price: number | null; shipping_price: number | null; platform_discount: number | null; bank_discount: number | null; cashback_amount: number | null; currency: string; source_observed_at: string | null; last_seen_at: string | null; merchants: { name: string } | null };
type Point = { price: number; observed_at: string; source_label: string | null; source_url: string | null };

const money = (value: number | null | undefined) => value == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not recorded";

export function ProductDetail({ slug }: { slug: string }) {
  const client = getSupabaseBrowserClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!client) { setLoading(false); return; }
      const [{ data: item }, { data: auth }] = await Promise.all([
        client.from("products").select("id,name,slug,brand,image_url,product_url,category").eq("slug", slug).eq("status", "published").maybeSingle(),
        client.auth.getUser()
      ]);
      if (cancelled) return;
      if (!item) { setLoading(false); return; }
      setProduct(item as Product);
      setUserId(auth.user?.id ?? null);
      const [listingResult, historyResult, watchResult] = await Promise.all([
        client.from("product_listings").select("id,source_key,seller_name,listing_url,affiliate_url,availability_status,item_price,shipping_price,platform_discount,bank_discount,cashback_amount,currency,source_observed_at,last_seen_at,merchants(name)").eq("product_id", item.id).eq("is_active", true).order("source_observed_at", { ascending: false }),
        client.from("price_observations").select("price,observed_at,source_label,source_url").eq("product_id", item.id).order("observed_at", { ascending: true }).limit(120),
        auth.user ? client.from("watchlists").select("target_price").eq("product_id", item.id).maybeSingle() : Promise.resolve({ data: null })
      ]);
      if (cancelled) return;
      setListings((listingResult.data ?? []) as unknown as Listing[]);
      setPoints((historyResult.data ?? []).map((row: any) => ({ price: Number(row.price), observed_at: row.observed_at, source_label: row.source_label, source_url: row.source_url })));
      if (watchResult.data?.target_price != null) setTarget(String(watchResult.data.target_price));
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [client, slug]);

  const latestPoint = points.length ? points[points.length - 1] : null;
  const latestListing = listings.find((item) => item.item_price != null) ?? null;
  const values = points.map((point) => point.price);
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;
  const chart = useMemo(() => {
    if (points.length < 2) return "";
    const lo = min ?? 0; const spread = (max ?? lo + 1) - lo || 1;
    return points.map((point, index) => {
      const x = 8 + index / (points.length - 1) * 584;
      const y = 118 - (point.price - lo) / spread * 96;
      return x + "," + y;
    }).join(" ");
  }, [points, min, max]);

  async function saveTarget() {
    if (!client || !product) return;
    if (!userId) { setMessage("Price alert save karne ke liye pehle sign in karein."); return; }
    const value = Number(target);
    if (!Number.isFinite(value) || value <= 0) { setMessage("Valid target price enter karein."); return; }
    setSaving(true); setMessage("");
    const { error: watchError } = await client.from("watchlists").upsert({ user_id: userId, product_id: product.id, target_price: value }, { onConflict: "user_id,product_id" });
    if (watchError) { setMessage("Save nahi hua: " + watchError.message); setSaving(false); return; }
    const { error: alertError } = await client.from("price_alerts").upsert({ user_id: userId, product_id: product.id, target_price: value, is_enabled: true }, { onConflict: "user_id,product_id" });
    setMessage(alertError ? "Watchlist save ho gayi, lekin alert setting save nahi hui: " + alertError.message : "Target price save ho gaya. Automatic notification approved price feed active hone ke baad hi bheji ja sakegi.");
    setSaving(false);
  }

  if (loading) return <div className="product-detail-shell"><p className="product-muted">Product details load ho rahi hain…</p></div>;
  if (!product) return <div className="product-detail-shell"><div className="product-not-found"><span>PRODUCT NOT FOUND</span><h1>Yeh product abhi catalogue mein available nahi hai.</h1><p>Product publish hone ke baad iska price comparison yahan dikhega.</p><Link href="/deals">Explore deals ↗</Link></div></div>;

  return <div className="product-detail-shell">
    <div className="product-breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/deals">Deals</Link><span>/</span><span>{product.name}</span></div>
    <section className="product-overview">
      <div className="product-visual">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="product-image-placeholder">SDI</div>}<span className="product-category-tag">{product.category ?? "PRODUCT"}</span></div>
      <div className="product-summary">
        <span className="product-kicker">SMART DEALS INDIA · PRODUCT INTELLIGENCE</span>
        <p className="product-brand">{product.brand ?? "Brand not listed"}</p>
        <h1>{product.name}</h1>
        <p className="product-subcopy">Compare available seller listings, review recorded price movements and set the price you want to pay.</p>
        <div className="product-key-price"><small>LOWEST LISTED ITEM PRICE</small><strong>{latestListing ? money(latestListing.item_price) : latestPoint ? money(latestPoint.price) : "Not available"}</strong><span>{latestListing ? "From a saved seller listing" : latestPoint ? "Latest recorded observation" : "No price records yet"}</span></div>
        <div className="product-actions"><a className="product-primary-link" href="#seller-comparison">Compare sellers ↓</a><a className="product-secondary-link" href="#price-history">View price history</a></div>
        <p className="product-data-note">Prices and stock can change by seller and PIN code. Confirm final checkout amount before purchase.</p>
      </div>
    </section>

    <section className="product-section" id="seller-comparison">
      <div className="product-section-head"><div><span className="product-kicker">SELLER COMPARISON</span><h2>Where can you buy it?</h2><p>Listings are shown only when a saved source record exists.</p></div><span className="product-count">{listings.length} listing{listings.length === 1 ? "" : "s"}</span></div>
      {listings.length ? <div className="seller-list">{listings.map((item) => {
        const payable = item.item_price == null ? null : Math.max(0, item.item_price + (item.shipping_price ?? 0) - (item.platform_discount ?? 0) - (item.bank_discount ?? 0));
        return <article className="seller-row" key={item.id}><div className="seller-brand"><span>{(item.merchants?.name ?? item.source_key).slice(0, 1).toUpperCase()}</span><div><b>{item.merchants?.name ?? item.source_key}</b><small>{item.seller_name ?? "Seller not specified"}</small></div></div><div className="seller-availability">{item.availability_status.replaceAll("_", " ")}</div><div className="seller-price"><small>ITEM PRICE</small><b>{money(item.item_price)}</b></div><div className="seller-price"><small>EST. PAYABLE*</small><b>{money(payable)}</b></div><div className="seller-actions">{(item.affiliate_url || item.listing_url) ? <a href={(item.affiliate_url || item.listing_url)!} target="_blank" rel="noopener noreferrer sponsored">View seller ↗</a> : <span>Link unavailable</span>}<small>Checked {dateLabel(item.source_observed_at ?? item.last_seen_at)}</small></div></article>;
      })}</div> : <div className="product-empty"><b>Seller comparison abhi ready nahi hai.</b><p>Approved retailer feeds se listings aane par yahan seller, availability aur checkout components compare honge.</p></div>}
      <p className="product-footnote">* Estimated payable = item price + shipping − platform discount − bank discount. Cashback is shown separately and is not deducted because eligibility and payout conditions may apply.</p>
    </section>

    <section className="product-section product-lower-grid">
      <div className="history-card" id="price-history"><div className="product-section-head"><div><span className="product-kicker">PRICE INTELLIGENCE</span><h2>Price history</h2><p>Recorded observations only. No generated or estimated history.</p></div></div>
        {points.length > 1 ? <><div className="history-chart-wrap"><svg viewBox="0 0 600 140" role="img" aria-label="Recorded price history chart"><line x1="8" y1="120" x2="592" y2="120" stroke="#dfe9e2" strokeWidth="1"/><polyline points={chart} fill="none" stroke="#168257" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></div><div className="history-range"><span><small>LOWEST RECORDED</small><b>{money(min)}</b></span><span><small>HIGHEST RECORDED</small><b>{money(max)}</b></span><span><small>OBSERVATIONS</small><b>{points.length}</b></span></div><p className="history-latest">Latest record: {dateLabel(latestPoint?.observed_at ?? null)} · {latestPoint?.source_label ?? "Source label unavailable"}</p></> : <div className="product-empty"><b>Abhi enough price history nahi hai.</b><p>Chart tab dikhega jab kam se kam do dated price observations save hongi.</p></div>}
      </div>
      <div className="target-card"><span className="product-kicker">PERSONAL PRICE ALERT</span><h2>Your target. Your timing.</h2><p>Apna target set karein. Alert configuration save hogi; actual notification approved feed aur notification delivery setup active hone par chalegi.</p><label>Target price (₹)<input type="number" min="1" step="1" inputMode="decimal" placeholder="e.g. 2499" value={target} onChange={(event) => setTarget(event.target.value)} /></label><button type="button" onClick={saveTarget} disabled={saving}>{saving ? "Saving…" : "Save target price"}</button>{message && <p className="target-message" role="status">{message}</p>}{!userId && <Link className="target-signin" href="/login">Sign in to save your alert ↗</Link>}</div>
    </section>
    <div className="product-transparency"><b>Our price promise</b><p>We separate seller listings, historical observations and cashback. We do not call a price “lowest ever” without enough dated records, and we never guarantee stock or checkout totals.</p></div>
  </div>;
}
