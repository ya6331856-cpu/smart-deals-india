import type { ReactNode, SVGProps } from "react";

export type IconName = "bag" | "home" | "tag" | "utensils" | "chart" | "user" | "search" | "heart" | "rupee" | "shield" | "smartphone" | "shirt" | "house" | "sparkles" | "plane" | "arrow" | "clock" | "check" | "bell" | "truck" | "camera";

const paths: Record<IconName, ReactNode> = {
  bag: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/><path d="m12 13 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 15.3l2-.3 1-2Z"/></>,
  home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
  tag: <><path d="M20 13 13 20 3 10V4h6l11 9Z"/><circle cx="7.5" cy="8" r="1"/></>,
  utensils: <><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11"/><path d="M16 3v18M16 3c3 2 4 5 4 8h-4"/></>,
  chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/><path d="M16 6h3v3"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
  heart: <path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.8 2.4Z"/>,
  rupee: <><path d="M6 4h12M6 9h12M7 4c6 0 8 2 8 5s-2 5-8 5l9 6"/></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m8.5 12 2.3 2.3 4.8-5"/></>,
  smartphone: <><rect x="6" y="2" width="12" height="20" rx="2.2"/><path d="M10 18h4"/></>,
  shirt: <><path d="m8 4 4 2 4-2 5 4-3 4-2-1v10H8V11l-2 1-3-4 5-4Z"/></>,
  house: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></>,
  plane: <><path d="m3 12 18-8-6 17-3-7-9-2Z"/><path d="m12 14 4-4"/></>,
  arrow: <><path d="M7 17 17 7M8 7h9v9"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  truck: <><path d="M3 6h11v12H3zM14 10h4l3 3v5h-7z"/><circle cx="7.5" cy="19" r="1.8"/><circle cx="17.5" cy="19" r="1.8"/></>,
  camera: <><path d="M4 7h4l2-2h4l2 2h4v13H4z"/><circle cx="12" cy="13" r="3.5"/></>,
};

export function UiIcon({ name, size = 20, strokeWidth = 1.8, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}

export function BrandGlyph({ size = 38 }: { size?: number }) {
  return <span className="brand-glyph" style={{ width: size, height: size }} aria-hidden="true"><svg viewBox="0 0 40 40" width="72%" height="72%" fill="none"><path d="M8 13h24l1.5 22h-27L8 13Z" fill="currentColor" opacity=".13"/><path d="M13 14V10a7 7 0 0 1 14 0v4M11 18h18l1 14H10l1-14Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round"/><path d="m20 20 1.5 3.5L25 25l-3.5 1.5L20 30l-1.5-3.5L15 25l3.5-1.5L20 20Z" fill="currentColor"/></svg></span>;
}
