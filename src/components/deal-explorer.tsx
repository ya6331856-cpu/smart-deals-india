"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { demoDeals } from "@/lib/demo-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Deal, DealCategory } from "@/lib/types";

type Filter = "all" | DealCategory;
type SortMode = "newest" | "saving";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All loot" },
  { id: "shopping", label: "Shopping" },
  { id: "food", label: "Food & dining" },
  { id: "travel", label: "Travel" },
  { id: "bills", label: "Bills & recharge" },
];
const artSymbols: Record<DealCategory, string> = { shopping: "✳", food: "♨", travel: "↗", bills: "⌁" };

function fallbackImage(category: DealCategory) { return ({ shopping: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", food: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85", travel: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85", bills: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85" })[category]; }

function formatPrice(value: number | null) {
  if (value === null) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function savingPercent(deal: Deal) {
  if (deal.offerPrice === null || deal.originalPrice === null || deal.originalPrice <= deal.offerPrice || deal.originalPrice <= 0) return null;
  return Math.round((1 - deal.offerPrice / deal.originalPrice) * 100);
}

export function DealExplorer({ initialFilter = "all", compact = false }: { initialFilter?: Filter; compact?: boolean }) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [deals, setDeals] = useState<Deal[]>(demoDeals);
  const [dataMode, setDataMode] = useState<"demo" | "database">("demo");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadDeals() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) { setLoading(false); return; }
      const now = new Date().toISOString();
      const [dealResult, couponResult] = await Promise.all([
        supabase.from("deals").select("id,title,description,category,offer_type,offer_price,original_price,discount_label,trust_label,source_label,source_url,affiliate_url,image_url,created_at,merchants(name)").eq("status", "active").lte("starts_at", now).gt("ends_at", now).order("created_at", { ascending: false }).limit(36),
        supabase.from("coupons").select("id,title,description,category,code,image_url,source_label,source_url,created_at,merchants(name)").eq("status", "active").lte("starts_at", now).gt("ends_at", now).order("created_at", { ascending: false }).limit(24),
      ]);
      if (cancelled) return;
      if (!dealResult.error || !couponResult.error) {
        const mappedDeals = (dealResult.data ?? []).map((row: any) => ({
          id: String(row.id), title: row.title, description: row.description ?? "", category: row.category as DealCategory,
          merchant: row.merchants?.name ?? "Merchant", imageUrl: row.image_url ?? null, offerPrice: row.offer_price === null ? null : Number(row.offer_price),
          originalPrice: row.original_price === null ? null : Number(row.original_price), discountLabel: row.discount_label,
          trustLabel: row.trust_label ?? "Price evidence pending", sourceLabel: row.source_label ?? "Source not provided", sourceUrl: row.source_url ?? null,
          affiliateUrl: row.affiliate_url, offerType: row.offer_type, isDemo: false,
        } satisfies Deal));
        const mappedCoupons = (couponResult.data ?? []).map((row: any) => ({
          id: `coupon-${row.id}`, title: row.title, description: row.description ?? "Review the merchant terms before using this code.", category: row.category as DealCategory,
          merchant: row.merchants?.name ?? "Merchant", imageUrl: row.image_url ?? null, offerPrice: null, originalPrice: null, discountLabel: "Coupon available",
          trustLabel: "Active coupon · check terms", sourceLabel: row.source_label ?? "Source not provided", sourceUrl: row.source_url ?? null, affiliateUrl: null,
          couponCode: row.code, offerType: "coupon" as const, isDemo: false,
        } satisfies Deal));
        const combined = [...mappedDeals, ...mappedCoupons];
        if (combined.length > 0) { setDeals(combined); setDataMode("database"); }
      }
      setLoading(false);
    }
    void loadDeals();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const result = deals.filter((deal) => {
      const matchesFilter = filter === "all" || deal.category === filter;
      const haystack = `${deal.title} ${deal.description} ${deal.merchant}`.toLowerCase();
      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
    if (sort === "saving") result.sort((a, b) => (savingPercent(b) ?? -1) - (savingPercent(a) ?? -1));
    return result;
  }, [deals, filter, query, sort]);

  return (
    <section className="deals-section" id="deals">
      <div className="section-heading-row">
        <div><p className="eyebrow">{compact ? "FRESH ON THE RADAR" : "THE DEAL HUNT"}</p><h2>{compact ? "Loot worth a look." : "Find your next smart buy."}</h2><p className="section-subtitle">Every listing should show its source. Price history and availability are displayed only when supported by recorded evidence.</p></div>
        <span className={`data-pill ${dataMode === "database" ? "is-live" : "is-demo"}`}>{dataMode === "database" ? "DATABASE OFFERS" : "PREVIEW MODE · SAMPLE CARDS"}</span>
      </div>
      {!compact && <div className="explorer-controls">
        <div className="filter-row" role="tablist" aria-label="Filter offers">{filters.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={`filter-chip ${filter === item.id ? "active" : ""}`} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
        <div className="explorer-tools"><label className="search-field"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, brand or offer" aria-label="Search deals" /></label><select className="sort-select" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort offers"><option value="newest">Newest first</option><option value="saving">Highest saving</option></select></div>
      </div>}
      {loading && <p className="loading-note">Checking the deal database…</p>}
      <div className="deal-grid">
        {visible.slice(0, compact ? 4 : 18).map((deal, index) => {
          const saving = savingPercent(deal);
          const hasEvidence = /history-backed|verified price history/i.test(deal.trustLabel) && !/pending|not enough/i.test(deal.trustLabel);
          return <article className="deal-card" key={deal.id}>
            <div className={`deal-art art-${index % 4} ${deal.imageUrl || deal.isDemo ? "has-image" : "image-missing"}`}>{deal.imageUrl ? <img className="deal-product-image" src={deal.imageUrl} alt={deal.title} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement?.classList.add("image-missing"); }} /> : deal.isDemo ? <img className="deal-product-image" src={fallbackImage(deal.category)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}<span className="art-kicker">{deal.isDemo ? "ILLUSTRATIVE DROP" : `${deal.category.toUpperCase()} DROP`}</span><span className="art-symbol" aria-hidden="true">{artSymbols[deal.category]}</span><span className="art-caption">{deal.merchant}</span></div>
            <div className="deal-card-body">
              <div className="deal-meta"><span>{deal.merchant}</span><span className="demo-label">{deal.isDemo ? "SAMPLE" : "LISTED"}</span></div>
              <h3>{deal.title}</h3><p className="deal-description">{deal.description}</p>
              <div className="price-row"><div>{deal.offerPrice !== null ? <><strong>{formatPrice(deal.offerPrice)}</strong>{deal.originalPrice !== null && <del>{formatPrice(deal.originalPrice)} listed reference</del>}</> : <strong className="coupon-price">Coupon / offer</strong>}</div>{saving !== null && <span className="discount-tag">{saving}% lower*</span>}{saving === null && deal.discountLabel && <span className="discount-tag">{deal.discountLabel}</span>}</div>
              <div className={`trust-row ${hasEvidence ? "is-trustworthy" : ""}`}><span className="trust-dot" />{deal.trustLabel}</div>
              <div className="source-line">SOURCE · {deal.sourceLabel}</div>{deal.sourceUrl && <a className="source-link" href={deal.sourceUrl} target="_blank" rel="noopener noreferrer">View source evidence ↗</a>}
              {deal.couponCode && !deal.isDemo ? <div className="coupon-code-row"><code>{deal.couponCode}</code><button type="button" onClick={() => { void navigator.clipboard?.writeText(deal.couponCode ?? ""); }}>Copy code</button></div> : deal.affiliateUrl && !deal.isDemo ? <a className="deal-link" href={deal.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">Open merchant offer <span>↗</span></a> : <span className="deal-link muted-link">{deal.isDemo ? "Preview card · not for purchase" : "Merchant link not added"}</span>}
            </div>
          </article>;
        })}
      </div>
      {visible.length === 0 && <div className="empty-state"><strong>No matching offers yet.</strong><span>Try another keyword or category. New reviewed deals will appear here.</span></div>}
      {compact && <div className="center-action"><Link className="text-link" href="/deals">Explore all loot <span>→</span></Link></div>}
      {dataMode === "demo" && <p className="demo-disclaimer">Preview mode: these sample cards and amounts are illustrative only. They are not live retailer prices, active coupons, price-drop claims or verified discounts. Real listings will appear after approved data sources are connected and reviewed.</p>}
      {dataMode === "database" && <p className="demo-disclaimer">* “% lower” compares the offer amount with the listed reference amount saved by the offer publisher. It is not a claim about historical lowest price. Review the source and merchant checkout terms before buying.</p>}
    </section>
  );
}
