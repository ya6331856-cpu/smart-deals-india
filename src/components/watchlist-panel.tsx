"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Product = { id: string; name: string; brand: string | null; merchants?: { name: string } | null };
type WatchRow = { id: string; target_price: number | null; products: { name: string; brand: string | null } | null };
type PricePoint = { price: number; observed_at: string; source_label: string };

export function WatchlistPanel() {
  const client = getSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [watchRows, setWatchRows] = useState<WatchRow[]>([]);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [productId, setProductId] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!client) { setLoading(false); setMessage("Supabase environment is not configured yet."); return; }
      const { data: { user } } = await client.auth.getUser();
      if (cancelled) return;
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const [productResult, watchResult] = await Promise.all([
        client.from("products").select("id,name,brand,merchants(name)").eq("status", "published").order("name").limit(100),
        client.from("watchlists").select("id,target_price,products(name,brand)").order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (!productResult.error) setProducts((productResult.data ?? []) as unknown as Product[]);
      if (!watchResult.error) setWatchRows((watchResult.data ?? []) as unknown as WatchRow[]);
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [client]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      if (!client || !productId) { setPricePoints([]); setHistoryLoading(false); return; }
      setHistoryLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await client.from("price_observations").select("price,observed_at,source_label").eq("product_id", productId).gte("observed_at", since).order("observed_at", { ascending: true }).limit(90);
      if (!cancelled) {
        setPricePoints(error ? [] : (data ?? []).map((row: any) => ({ price: Number(row.price), observed_at: row.observed_at, source_label: row.source_label })));
        setHistoryLoading(false);
      }
    }
    void loadHistory();
    return () => { cancelled = true; };
  }, [client, productId]);

  const historyValues = pricePoints.map((point) => point.price);
  const historyMin = historyValues.length ? Math.min(...historyValues) : null;
  const historyMax = historyValues.length ? Math.max(...historyValues) : null;
  const sortedValues = [...historyValues].sort((a, b) => a - b);
  const historyMedian = sortedValues.length ? (sortedValues.length % 2 ? sortedValues[Math.floor(sortedValues.length / 2)] : (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2) : null;
  const historySpanDays = pricePoints.length > 1 ? (new Date(pricePoints[pricePoints.length - 1].observed_at).getTime() - new Date(pricePoints[0].observed_at).getTime()) / 86400000 : 0;
  const historySignal = pricePoints.length < 5 || historySpanDays < 7 ? "Not enough history to judge this price" : (historyValues[historyValues.length - 1] <= (historyMedian ?? 0) * 0.9 ? "Below tracked 30-day median" : historyValues[historyValues.length - 1] >= (historyMedian ?? 0) * 1.05 ? "Above recent 30-day median" : "Close to tracked 30-day median");
  const chartPoints = pricePoints.map((point, index) => {
    const min = historyMin ?? 0; const max = historyMax ?? min + 1; const spread = max - min || 1;
    const x = pricePoints.length > 1 ? 4 + (index / (pricePoints.length - 1)) * 292 : 150;
    const y = 66 - ((point.price - min) / spread) * 54;
    return `${x},${y}`;
  }).join(" ");

  async function addWatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    if (!client || !userId || !productId) return;
    const target = targetPrice.trim() ? Number(targetPrice) : null;
    if (target !== null && (!Number.isFinite(target) || target <= 0)) { setMessage("Target price zero se zyada hona chahiye."); return; }
    setBusy(true);
    const { error } = await client.from("watchlists").upsert({ user_id: userId, product_id: productId, target_price: target }, { onConflict: "user_id,product_id" });
    if (error) setMessage(error.message);
    else {
      let alertIssue = "";
      if (target !== null) {
        const { error: alertError } = await client.from("price_alerts").upsert({ user_id: userId, product_id: productId, target_price: target, is_enabled: true }, { onConflict: "user_id,product_id" });
        if (alertError) alertIssue = ` Watchlist saved, but alert setting failed: ${alertError.message}`;
      }
      setMessage(`Product watchlist mein save ho gaya. Automatic notifications tab activate hongi jab approved price feed connect hoga.${alertIssue}`);
      const { data } = await client.from("watchlists").select("id,target_price,products(name,brand)").order("created_at", { ascending: false });
      setWatchRows((data ?? []) as unknown as WatchRow[]);
      setProductId(""); setTargetPrice("");
    }
    setBusy(false);
  }

  if (loading) return <div className="watchlist-panel"><p className="loading-note">Checking your account and watchlist…</p></div>;
  if (!userId) return <div className="watchlist-panel"><div className="watchlist-empty-icon">⌁</div><div><span className="panel-kicker">PERSONAL PRICE WATCH</span><h2>Keep your next buy on the radar.</h2><p>Sign in to save listed products and set the price you are comfortable paying.</p><Link className="primary-button" href="/login">Sign in to start <span>↗</span></Link></div></div>;

  return <div className="watchlist-panel"><div className="watchlist-form-wrap"><span className="panel-kicker">ADD TO WATCHLIST</span><h2>Set your target price.</h2><p>Choose a product already published in the deal catalogue. A target price is saved to your account; alerts need an active, approved source that reports new prices.</p>
      {products.length ? <form className="watchlist-form" onSubmit={addWatch}><label>Product<select required value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Choose a product</option>{products.map((product) => <option value={product.id} key={product.id}>{product.name}{product.brand ? ` · ${product.brand}` : ""}</option>)}</select></label><label>Alert me at (₹)<input inputMode="decimal" type="number" min="1" step="1" placeholder="e.g. 2500" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} /></label><button className="primary-button" type="submit" disabled={busy || !productId}>{busy ? "Saving…" : "Save price watch"} <span>↗</span></button></form> : <div className="empty-state"><strong>No products in the catalogue yet.</strong><span>Once reviewed offers are published, you can add them here.</span></div>}
      {message && <p className="admin-message" role="status">{message}</p>}
      {productId && <div className="history-insight"><div className="history-insight-head"><span className="panel-kicker">30-DAY PRICE CHECK</span><b>{historySignal}</b></div>{historyLoading ? <p className="empty-admin">Loading saved price observations…</p> : pricePoints.length ? <><svg className="history-chart" viewBox="0 0 300 76" role="img" aria-label="Recorded product price history"><line x1="4" y1="66" x2="296" y2="66" stroke="#33403a" strokeWidth="1"/><polyline points={chartPoints} fill="none" stroke="#caff4b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg><div className="history-stats"><span><small>LOWEST</small><b>₹{historyMin?.toLocaleString("en-IN")}</b></span><span><small>MEDIAN</small><b>₹{historyMedian?.toLocaleString("en-IN")}</b></span><span><small>LATEST</small><b>₹{historyValues[historyValues.length - 1]?.toLocaleString("en-IN")}</b></span></div><p className="history-note">{pricePoints.length} dated observations · {Math.floor(historySpanDays)} days covered. This is a signal from saved records, not a guarantee of the merchant's live checkout price.</p></> : <p className="empty-admin">No dated prices are stored for this product yet. The detector needs at least 5 observations across 7 days before showing a stronger signal.</p>}</div>}
    </div><div className="watchlist-saved"><span className="panel-kicker">YOUR SAVED ITEMS</span><h3>{watchRows.length} products watched</h3>{watchRows.length ? watchRows.map((row) => <div className="watch-row" key={row.id}><span>⌁</span><div><b>{row.products?.name ?? "Product"}</b><small>{row.target_price === null ? "No target price" : `Target ₹${Number(row.target_price).toLocaleString("en-IN")}`}</small></div></div>) : <p className="empty-admin">Your saved products will appear here.</p>}</div></div>;
}
