"use client";

import { useMemo, useState } from "react";
import { UiIcon } from "@/components/ui-icon";

const money = (amount: number) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(amount);

function amount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function TruePriceChecker() {
  const [product, setProduct] = useState("");
  const [listedPrice, setListedPrice] = useState("");
  const [coupon, setCoupon] = useState("");
  const [bank, setBank] = useState("");
  const [charges, setCharges] = useState("");
  const [cashback, setCashback] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const list = amount(listedPrice);
    const couponSaving = Math.min(amount(coupon), list);
    const bankSaving = Math.min(amount(bank), Math.max(0, list - couponSaving));
    const extra = amount(charges);
    const postPurchase = Math.min(amount(cashback), Math.max(0, list - couponSaving - bankSaving + extra));
    const checkout = Math.max(0, list - couponSaving - bankSaving) + extra;
    return {
      ready: list > 0,
      list,
      couponSaving,
      bankSaving,
      extra,
      postPurchase,
      checkout,
      afterCashback: Math.max(0, checkout - postPurchase),
      instantSaving: couponSaving + bankSaving,
    };
  }, [listedPrice, coupon, bank, charges, cashback]);

  const shareText = [
    "Smart Deals India · True Price Check",
    product.trim() ? "Product: " + product.trim() : "",
    "Listed price: " + money(result.list),
    "Coupon saving: −" + money(result.couponSaving),
    "Instant bank saving: −" + money(result.bankSaving),
    "Delivery / platform charges: +" + money(result.extra),
    "Pay at checkout: " + money(result.checkout),
    "Eligible cashback after purchase: " + money(result.postPurchase),
    "Estimated cost after cashback: " + money(result.afterCashback),
    "Check seller and offer terms before paying.",
  ].filter(Boolean).join("\n");

  async function copyBreakdown() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function reset() {
    setProduct("");
    setListedPrice("");
    setCoupon("");
    setBank("");
    setCharges("");
    setCashback("");
    setCopied(false);
  }

  return (
    <section className="true-price-tool" aria-labelledby="true-price-title">
      <div className="true-price-intro">
        <span className="true-price-kicker"><UiIcon name="shield" size={14} /> THE BUYER-SIDE CHECKOUT CALCULATOR</span>
        <h2 id="true-price-title">Discount nahi. <em>Asli bill dekho.</em></h2>
        <p>Coupon, instant bank discount aur delivery charges ek jagah jodo. Cashback ko alag rakho, kyunki woh checkout par turant nahi kat-ta.</p>
        <div className="true-price-points">
          <span><UiIcon name="check" size={13}/> No sign-up needed</span>
          <span><UiIcon name="check" size={13}/> Calculation stays on this device</span>
          <span><UiIcon name="check" size={13}/> Cashback shown separately</span>
        </div>
      </div>

      <div className="true-price-workspace">
        <div className="true-price-fields">
          <label className="true-price-field true-price-product">
            <span>Product name <small>Optional</small></span>
            <input value={product} onChange={(event) => setProduct(event.target.value)} placeholder="e.g. Wireless headphones" maxLength={90}/>
          </label>
          <label className="true-price-field">
            <span>Listed product price <b>₹</b></span>
            <input type="number" inputMode="decimal" min="0" step="1" value={listedPrice} onChange={(event) => setListedPrice(event.target.value)} placeholder="Enter price" />
          </label>
          <label className="true-price-field">
            <span>Coupon discount <b>− ₹</b></span>
            <input type="number" inputMode="decimal" min="0" step="1" value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="0" />
          </label>
          <label className="true-price-field">
            <span>Instant bank discount <b>− ₹</b></span>
            <input type="number" inputMode="decimal" min="0" step="1" value={bank} onChange={(event) => setBank(event.target.value)} placeholder="0" />
          </label>
          <label className="true-price-field">
            <span>Delivery / platform charges <b>+ ₹</b></span>
            <input type="number" inputMode="decimal" min="0" step="1" value={charges} onChange={(event) => setCharges(event.target.value)} placeholder="0" />
          </label>
          <label className="true-price-field">
            <span>Cashback after purchase <b>₹</b></span>
            <input type="number" inputMode="decimal" min="0" step="1" value={cashback} onChange={(event) => setCashback(event.target.value)} placeholder="0" />
          </label>
          <p className="true-price-hint">Enter only the discounts you are eligible for. Check minimum spend, card type, coupon rules and seller terms on the retailer checkout page.</p>
        </div>

        <aside className="true-price-result" aria-live="polite">
          <div className="true-price-result-head"><span><i/> YOUR CHECKOUT BREAKDOWN</span><span className="true-price-local">LOCAL CALCULATION</span></div>
          {!result.ready ? (
            <div className="true-price-empty"><span className="true-price-empty-icon"><UiIcon name="calculator" size={26}/></span><strong>Enter the listed price</strong><p>Your real checkout estimate will appear here.</p></div>
          ) : (
            <>
              <div className="true-price-main-total"><small>Amount to pay now</small><strong>{money(result.checkout)}</strong><span>At checkout · before any later cashback</span></div>
              <div className="true-price-breakdown">
                <div><span>Listed price</span><b>{money(result.list)}</b></div>
                <div><span>Coupon discount</span><b className="saving">− {money(result.couponSaving)}</b></div>
                <div><span>Instant bank discount</span><b className="saving">− {money(result.bankSaving)}</b></div>
                <div><span>Delivery / platform charges</span><b>+ {money(result.extra)}</b></div>
                <div className="breakdown-total"><span>Pay at checkout</span><b>{money(result.checkout)}</b></div>
              </div>
              <div className="true-price-cashback"><span>Estimated cost after eligible cashback</span><strong>{money(result.afterCashback)}</strong><small>Includes {money(result.postPurchase)} cashback later, only if the offer tracks and pays out.</small></div>
              <div className="true-price-saving-line"><UiIcon name="check" size={14}/> Instant discount applied: {money(result.instantSaving)}</div>
              <button className="true-price-copy" type="button" onClick={copyBreakdown}><UiIcon name={copied ? "check" : "copy"} size={15}/>{copied ? "Breakdown copied" : "Copy price breakdown"}</button>
            </>
          )}
          <p className="true-price-disclaimer">Estimate only. This tool does not fetch or verify retailer prices, apply offers, or guarantee cashback. Final amount depends on your pincode, seller, payment method and eligibility.</p>
        </aside>
      </div>
      <button type="button" className="true-price-reset" onClick={reset}>Clear calculator</button>
    </section>
  );
}
