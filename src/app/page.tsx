import Link from "next/link";
import { DealExplorer } from "@/components/deal-explorer";
import { UiIcon } from "@/components/ui-icon";

const categories = [
  { icon: "smartphone" as const, title: "Mobiles & tech", note: "Phones, audio and gadgets", href: "/deals", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=520&q=80", tone: "mint" },
  { icon: "shirt" as const, title: "Fashion", note: "Everyday style and footwear", href: "/deals", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=520&q=80", tone: "peach" },
  { icon: "house" as const, title: "Home & kitchen", note: "Useful upgrades for home", href: "/deals", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=520&q=80", tone: "blue" },
  { icon: "sparkles" as const, title: "Beauty & care", note: "Personal care and wellness", href: "/deals", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=520&q=80", tone: "pink" },
  { icon: "utensils" as const, title: "Food offers", note: "Dining and delivery savings", href: "/food", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=520&q=80", tone: "yellow" },
  { icon: "plane" as const, title: "Travel deals", note: "Plan trips for less", href: "/deals", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=520&q=80", tone: "lavender" },
];

const collections = [
  { eyebrow: "SMART SHOPPING", title: "Compare before you buy", copy: "Check listed offers, source details and price context before checkout.", href: "/deals", action: "Explore shopping deals", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1100&q=85", tone: "collection-tech" },
  { eyebrow: "PRICE WATCH", title: "Wait for your price", copy: "Save products to your watchlist and set the price you want to pay.", href: "/price-tracker", action: "Open price tracker", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=85", tone: "collection-watch" },
];

export default function HomePage() {
  return (
    <div className="storefront">
      <section className="store-hero">
        <div className="store-hero-copy">
          <span className="store-tag"><i /> SMART SHOPPING DISCOVERY</span>
          <h1>Good deals.<br /><em>Clear decisions.</em></h1>
          <p>Discover shopping offers, food savings and price drops in one place. Check the source, understand the offer and buy when it makes sense.</p>
          <div className="store-hero-actions">
            <Link href="/deals" className="store-primary">Explore deals <UiIcon name="arrow" size={15} /></Link>
            <Link href="/deal-check" className="store-secondary">Check your final price</Link>
          </div>
          <div className="store-assurance"><span><UiIcon name="check" size={12} /></span> Offer sources shown · No made-up price history</div>
        </div>
        <div className="store-hero-art"><div className="radar-orbit radar-orbit-one" aria-hidden="true"><span /><i /><b /></div><div className="radar-orbit radar-orbit-two" aria-hidden="true"><span /></div><div className="radar-status"><i /> DEAL RADAR <b>PRICE INTELLIGENCE</b></div>
          <div className="hero-image-main"><img src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=85" alt="Electronics and gadgets on a desk" fetchPriority="high" /></div>
          <div className="hero-image-float hero-float-one"><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80" alt="Wireless headphones" /><span>Tech finds</span></div>
          <div className="hero-image-float hero-float-two"><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80" alt="Minimal wristwatch" /><span>Smart picks</span></div>
          <div className="hero-sticker"><b>SMART</b><span>DEALS<br />INDIA</span></div>
        </div>
      </section>

      <section className="store-category-section">
        <div className="store-section-head"><div><span className="store-eyebrow">EXPLORE THE STORE</span><h2>Shop by category</h2><p>Find offers across the things you actually use.</p></div><Link href="/deals" className="store-view-all">View all deals <UiIcon name="arrow" size={13} /></Link></div>
        <div className="store-category-grid">
          {categories.map((category) => (
            <Link href={category.href} className={`store-category-card ${category.tone}`} key={category.title}>
              <div className="store-category-image"><img src={category.image} alt="" loading="lazy" /><span className="category-icon-bubble"><UiIcon name={category.icon} size={22} /></span></div>
              <div className="store-category-text"><b>{category.title}</b><span>{category.note}</span></div>
              <span className="store-category-arrow"><UiIcon name="arrow" size={15} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="store-feature-strip">
        <div><span className="feature-icon"><UiIcon name="shield" size={19} /></span><span><b>Source-first offers</b><small>Know where an offer comes from</small></span></div>
        <div><span className="feature-icon"><UiIcon name="chart" size={19} /></span><span><b>Price watch</b><small>Track your target price</small></span></div>
        <div><span className="feature-icon"><UiIcon name="heart" size={19} /></span><span><b>Your watchlist</b><small>Keep an eye on products</small></span></div>
        <div><span className="feature-icon"><UiIcon name="rupee" size={19} /></span><span><b>Made for India</b><small>Shopping, food and more</small></span></div>
      </section>

      <section className="true-price-promo">
        <div className="true-price-promo-copy">
          <span className="store-eyebrow"><UiIcon name="shield" size={13}/> THE SMART DEALS DIFFERENCE</span>
          <h2>Discount dekhkar nahi.<br/><em>Final bill samajhkar kharido.</em></h2>
          <p>Coupon, eligible bank offer aur delivery charges ke baad kitna pay karna padega? Cashback ko alag rakho. Checkout se pehle apna real estimate dekho.</p>
          <Link href="/deal-check" className="store-primary">Check my final price <UiIcon name="arrow" size={14}/></Link>
        </div>
        <div className="true-price-promo-points">
          <div><span>01</span><b>Actual checkout estimate</b><small>Instant discounts minus, charges plus</small></div>
          <div><span>02</span><b>Cashback kept separate</b><small>Future reward is not instant saving</small></div>
          <div><span>03</span><b>Price proof as we grow</b><small>Sources and dated history when available</small></div>
        </div>
      </section>

      <div className="store-deal-wrap"><DealExplorer compact /></div>

      <section className="store-collections">
        {collections.map((item) => (
          <article className={`store-collection-card ${item.tone}`} key={item.title}>
            <div className="store-collection-copy"><span className="store-eyebrow">{item.eyebrow}</span><h2>{item.title}</h2><p>{item.copy}</p><Link href={item.href}>{item.action} <UiIcon name="arrow" size={13} /></Link></div>
            <div className="store-collection-image"><img src={item.image} alt="" loading="lazy" /></div>
          </article>
        ))}
      </section>

      <section className="store-food-banner">
        <div className="store-food-image"><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1100&q=85" alt="Freshly prepared pizza" loading="lazy" /></div>
        <div className="store-food-copy"><span className="store-eyebrow">FOOD & DINING SAVINGS</span><h2>Full plate.<br /><em>Smaller bill.</em></h2><p>Explore food delivery, dining and eligible bank-card offers. Always check the terms before using an offer.</p><Link href="/food" className="store-primary">Explore food offers <span>↗</span></Link></div>
      </section>

      <section className="store-trust-row">
        <div><span className="store-eyebrow">A BETTER WAY TO SHOP</span><h2>Discounts are easy to show.<br /><em>Proof is what matters.</em></h2></div>
        <p>We distinguish sample previews from published offers, show the source behind a listing and only call a price trend verified when enough dated observations support it.</p>
        <Link href="/price-tracker">How price tracking works <UiIcon name="arrow" size={13} /></Link>
      </section>
    </div>
  );
}
