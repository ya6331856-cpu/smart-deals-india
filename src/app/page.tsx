import Link from "next/link";
import { DealExplorer } from "@/components/deal-explorer";

const categories = [
  { icon: "▣", title: "Electronics", copy: "Phones, audio, gadgets", href: "/deals" },
  { icon: "⌂", title: "Home & living", copy: "Daily-use smart buys", href: "/deals" },
  { icon: "♨", title: "Food & dining", copy: "Coupons and brand offers", href: "/food" },
  { icon: "↘", title: "Price watch", copy: "Set a target and track", href: "/price-tracker" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero-shell">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-spark">✳</span> INDIA'S SMARTER DEAL RADAR <span className="kicker-live">BETA</span></div>
            <h1>Loot pakdo.<br /><em>Hisaab se kharido.</em></h1>
            <p className="hero-lede">Shopping deals, food coupons aur price history — sab ek jagah. Sirf discount ka sticker nahi, offer ka source aur price ka context bhi.</p>
            <div className="hero-actions"><Link href="/deals" className="primary-button">Explore today&apos;s loot <span>↗</span></Link><Link href="/price-tracker" className="secondary-button">Track a product <span>⌁</span></Link></div>
            <div className="hero-proof"><span className="proof-star">✳</span><span>Source first. Savings second. Hype never.</span></div>
          </div>
          <div className="hero-visual" aria-label="Illustrative loot radar and price tracking card">
            <div className="radar-grid"><div className="radar-ring ring-a"/><div className="radar-ring ring-b"/><div className="radar-ring ring-c"/><div className="radar-sweep"/><span className="radar-center">SD</span><span className="radar-point point-a"/><span className="radar-point point-b"/><span className="radar-point point-c"/></div>
            <div className="loot-preview-card">
              <div className="preview-top"><span className="preview-pill"><i/> SAMPLE DROP</span><span className="preview-dots">•••</span></div>
              <div className="preview-product"><div className="preview-product-art">🎧</div><div><span className="preview-brand">ILLUSTRATIVE PRODUCT</span><strong>Wireless headphones</strong><small>Example price movement</small></div></div>
              <div className="preview-price-line"><div><small>EXAMPLE OFFER PRICE</small><strong>₹1,499</strong><del>₹2,499 listed reference</del></div><span className="preview-save">40%<small>sample</small></span></div>
              <div className="preview-chart"><svg viewBox="0 0 320 70" role="img" aria-label="Illustrative price trend"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#caff4b" stopOpacity=".30"/><stop offset="1" stopColor="#caff4b" stopOpacity="0"/></linearGradient></defs><path d="M2 14 C26 8 38 27 58 22 S87 30 107 19 S141 34 163 30 S195 43 216 34 S254 44 278 49 S302 42 318 56 L318 70 L2 70Z" fill="url(#chartFill)"/><path d="M2 14 C26 8 38 27 58 22 S87 30 107 19 S141 34 163 30 S195 43 216 34 S254 44 278 49 S302 42 318 56" fill="none" stroke="#caff4b" strokeWidth="3" strokeLinecap="round"/></svg></div>
              <div className="preview-foot"><span>Price signal: evidence pending</span><span>Preview only</span></div>
            </div>
            <div className="floating-chip chip-save"><span>↘</span><div><b>Price watch</b><small>Your target. Your timing.</small></div></div>
            <div className="floating-chip chip-source"><span>✓</span><div><b>Source shown</b><small>Know before you go</small></div></div>
            <div className="visual-disclaimer">Illustrative numbers · not live offers</div>
          </div>
        </div>
        <div className="hero-bottom-line"><span>SHOP SMART</span><span>FOOD OFFERS</span><span>PRICE HISTORY</span><span>MADE FOR INDIA</span></div>
      </section>

      <div className="page-container">
        <section className="quick-stats">
          <div><strong>01</strong><span>Offer source visible</span></div><div><strong>02</strong><span>Price history planned in</span></div><div><strong>03</strong><span>Watchlist-ready</span></div><div><strong>04</strong><span>Shopping + food together</span></div>
        </section>

        <section className="category-section">
          <div className="section-heading-row"><div><p className="eyebrow">PICK YOUR HUNT</p><h2>Where are we finding <em>loot?</em></h2></div><span className="section-aside">Browse by category <b>↘</b></span></div>
          <div className="category-grid">{categories.map((item, index) => <Link href={item.href} className={`category-tile category-${index}`} key={item.title}><span className="category-icon">{item.icon}</span><span><b>{item.title}</b><small>{item.copy}</small></span><i>↗</i></Link>)}</div>
        </section>

        <DealExplorer compact />

        <section className="trust-feature-grid">
          <div className="trust-feature-main"><p className="eyebrow">THE SMART DEALS RULE</p><h2>MRP cut hona, <em>proof nahi hota.</em></h2><p>We keep the offer source, price observation date and price history together. One price point can show a listed offer — it cannot prove a genuine long-term discount.</p><Link href="/price-tracker" className="text-link">How price watch works <span>↗</span></Link></div>
          <div className="trust-feature-list"><div><span>01</span><div><b>Source trail</b><small>See where the deal information came from.</small></div><i>↗</i></div><div><span>02</span><div><b>Price context</b><small>Compare dated observations when enough history exists.</small></div><i>↗</i></div><div><span>03</span><div><b>Personal alerts</b><small>Save a product and choose the price you want.</small></div><i>↗</i></div></div>
        </section>

        <section className="tracker-cta"><div><p className="eyebrow light-eyebrow">DON&apos;T CHASE THE PRICE</p><h2>Set your price.<br /><em>Let the alert find you.</em></h2><p>Build a watchlist for the things you actually want to buy.</p></div><Link href="/price-tracker" className="light-button">Start price watch <span>↗</span></Link><div className="cta-decoration">₹</div></section>
      </div>
    </>
  );
}
