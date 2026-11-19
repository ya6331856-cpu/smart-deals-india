import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Smart Deals India — Loot Radar", short_name: "Smart Deals",
    description: "Shopping loot, food offers and price watch for India.",
    start_url: "/", display: "standalone", orientation: "portrait",
    background_color: "#0a0d0e", theme_color: "#0a0d0e",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
