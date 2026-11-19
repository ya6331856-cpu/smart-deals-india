import Link from "next/link";

const links = [
  { href: "/deals", label: "Shopping loot" },
  { href: "/food", label: "Food offers" },
  { href: "/price-tracker", label: "Price watch" },
];

export function SiteHeader() {
  return (
    <>
      <div className="top-ribbon"><span className="ribbon-pulse" /> SMART DEALS RADAR <span className="ribbon-divider">/</span> Loot pakdo. Price samajh kar kharido.</div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Smart Deals India home">
            <span className="brand-mark">SD<span>✳</span></span>
            <span className="brand-copy">smart<span>deals</span><small>INDIA · LOOT RADAR</small></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link className="login-link" href="/login">Sign in</Link>
            <Link className="header-cta" href="/price-tracker">Track a price <span>↗</span></Link>
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <Link href="/" aria-label="Home"><span>⌂</span><small>Home</small></Link>
        <Link href="/deals" aria-label="Shopping deals"><span>✳</span><small>Loot</small></Link>
        <Link href="/food" aria-label="Food offers"><span>♨</span><small>Food</small></Link>
        <Link href="/price-tracker" aria-label="Price tracker"><span>↘</span><small>Watch</small></Link>
        <Link href="/login" aria-label="Account"><span>◉</span><small>Account</small></Link>
      </nav>
    </>
  );
}
