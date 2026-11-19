export type DealCategory = "shopping" | "food" | "travel" | "bills";

export type Deal = {
  id: string;
  title: string;
  description: string;
  category: DealCategory;
  merchant: string;
  offerPrice: number | null;
  originalPrice: number | null;
  discountLabel: string | null;
  trustLabel: string;
  sourceLabel: string;
  sourceUrl?: string | null;
  affiliateUrl: string | null;
  couponCode?: string | null;
  offerType?: "price_drop" | "coupon" | "bank_offer" | "bundle" | "cashback" | "limited_offer";
  isDemo: boolean;
};
