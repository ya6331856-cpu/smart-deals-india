import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://smartdealsindia.in").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Smart Deals India — Loot Radar for smarter savings", template: "%s | Smart Deals India" },
  description: "Shopping loot, food coupons and price history in one place. Check offer sources and price signals before you buy.",
  applicationName: "Smart Deals India",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Smart Deals" },
  formatDetection: { telephone: false },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: { type: "website", siteName: "Smart Deals India", title: "Smart Deals India — Loot Radar", description: "Loot pakdo. Price samajh kar kharido." },
};

export const viewport: Viewport = { themeColor: "#0b0e0f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN">
      <body><ServiceWorkerRegister /><SiteHeader /><main>{children}</main><SiteFooter /></body>
    </html>
  );
}
