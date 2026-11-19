import type { Metadata } from "next";
import { WatchlistPanel } from "@/components/watchlist-panel";
export const metadata: Metadata = { title: "Price watch", description: "Build a product watchlist and set your target price." };
export default function PriceTrackerPage() {
  return <div className="page-container subpage"><div className="subpage-heading"><p className="eyebrow">PRICE WATCH / 03</p><h1>Set your number.<br /><em>Wait for the drop.</em></h1><p>Save products you are planning to buy and set a comfortable target. Price alerts become meaningful only after a supported source starts sending fresh, timestamped observations.</p></div>
    <WatchlistPanel />
    <div className="transparency-grid"><div><b>01 / RECORD</b><h3>Dated price observations</h3><p>Each price point must include a timestamp and a permitted source. Old or unsourced prices should not be treated as proof.</p></div><div><b>02 / COMPARE</b><h3>Price history</h3><p>Compare the latest observation with available 30- and 90-day history when enough records exist.</p></div><div><b>03 / SIGNAL</b><h3>Honest discount status</h3><p>One listed reference price is not enough to prove a genuine discount. We show “evidence pending” until the history supports a stronger statement.</p></div></div>
  </div>;
}
