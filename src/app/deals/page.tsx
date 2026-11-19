import type { Metadata } from "next";
import { DealExplorer } from "@/components/deal-explorer";
export const metadata: Metadata = { title: "Shopping loot", description: "Explore shopping deals with visible sources and price context." };
export default function DealsPage() {
  return <div className="page-container subpage"><div className="subpage-heading"><p className="eyebrow">SHOPPING RADAR / 01</p><h1>Find the drop.<br /><em>Check the price.</em></h1><p>Gadgets, home essentials and everyday shopping offers. Compare the offer with its listed reference and check the source before you leave for the merchant.</p></div><DealExplorer /></div>;
}
