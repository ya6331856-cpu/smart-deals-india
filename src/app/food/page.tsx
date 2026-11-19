import type { Metadata } from "next";
import { DealExplorer } from "@/components/deal-explorer";
export const metadata: Metadata = { title: "Food offers", description: "Food coupons, dining promotions and bank offers in one place." };
export default function FoodPage() {
  return <div className="page-container subpage"><div className="subpage-heading"><p className="eyebrow">FOOD & DINING RADAR / 02</p><h1>Full plate.<br /><em>Smaller bill.</em></h1><p>Brand coupons, restaurant promotions and eligible bank offers. Always check minimum order, location, payment method and expiry terms on the merchant page.</p></div><DealExplorer initialFilter="food" /></div>;
}
