import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <Link href="/" className="brand footer-brand"><span className="brand-mark">SD<span>✳</span></span><span className="brand-copy">smart<span>deals</span><small>INDIA · LOOT RADAR</small></span></Link>
          <p>Better deals start with better information. Find offers, check the source and make your own call.</p>
        </div>
        <div className="footer-links"><strong>Explore</strong><Link href="/deals">Shopping loot</Link><Link href="/food">Food offers</Link><Link href="/price-tracker">Price watch</Link><Link href="/admin">Admin studio</Link></div>
        <div className="footer-links"><strong>Good to know</strong><Link href="/affiliate-disclosure">Affiliate disclosure</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Smart Deals India</span><span>Independent deal discovery · Merchant terms always apply</span></div>
    </footer>
  );
}
