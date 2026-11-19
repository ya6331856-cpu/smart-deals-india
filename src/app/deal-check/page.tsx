import type { Metadata } from "next";
import Link from "next/link";
import { TruePriceChecker } from "@/components/true-price-checker";

export const metadata: Metadata = {
  title: "True Price Check",
  description: "Calculate your estimated checkout total after coupon savings, instant bank discounts and delivery charges. Keep later cashback separate.",
};

export default function DealCheckPage() {
  return (
    <div className="page-container subpage true-price-page">
      <div className="subpage-heading">
        <p className="eyebrow">SMART BUY TOOL / 01</p>
        <h1>Know the bill.<br/><em>Before you buy.</em></h1>
        <p>Retailer banners show discounts. Smart Deals India helps you work out the amount you may actually pay after eligible offers and charges.</p>
        <div className="true-price-page-links"><Link href="/deals">Browse listed deals</Link><Link href="/price-tracker">Set a target price</Link></div>
      </div>
      <TruePriceChecker />
      <div className="true-price-promise">
        <span className="true-price-promise-icon"><span>01</span></span>
        <div><b>Our promise: proof before promotion.</b><p>When verified price feeds are connected, product checks will add source links, last-checked time and supported price history. We will not call a discount “genuine” just because a crossed-out price is large.</p></div>
      </div>
    </div>
  );
}
