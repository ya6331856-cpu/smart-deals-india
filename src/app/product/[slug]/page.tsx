import type { Metadata } from "next";
import { ProductDetail } from "@/components/product-detail";

export const metadata: Metadata = {
  title: "Product price comparison",
  description: "Compare seller listings, inspect recorded price history and set a target price.",
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
