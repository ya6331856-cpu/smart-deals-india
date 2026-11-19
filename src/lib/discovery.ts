export type DiscoveryEvent = {
  type: "category" | "view" | "merchant";
  category: "shopping" | "food" | "travel" | "bills";
  merchant?: string;
  at: number;
};

const STORAGE_KEY = "sdi-discovery-v1";
const MAX_EVENTS = 120;
const DAY = 24 * 60 * 60 * 1000;

export function readDiscoveryEvents(): DiscoveryEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((event): event is DiscoveryEvent =>
      event && ["category", "view", "merchant"].includes(event.type) &&
      ["shopping", "food", "travel", "bills"].includes(event.category) &&
      typeof event.at === "number" && event.at > Date.now() - 90 * DAY
    ).slice(-MAX_EVENTS);
  } catch {
    return [];
  }
}

export function saveDiscoveryEvent(event: DiscoveryEvent): DiscoveryEvent[] {
  const events = [...readDiscoveryEvents(), event].slice(-MAX_EVENTS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch { /* Storage may be unavailable. */ }
  return events;
}

export function clearDiscoveryEvents(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
}

export function getDiscoveryScore(
  category: DiscoveryEvent["category"],
  merchant: string,
  events: DiscoveryEvent[],
): number {
  const now = Date.now();
  const normalizedMerchant = merchant.trim().toLowerCase();
  return events.reduce((score, event) => {
    const ageDays = Math.max(0, (now - event.at) / DAY);
    const decay = Math.pow(0.94, ageDays);
    const weight = event.type === "category" ? 3 : event.type === "merchant" ? 2.5 : 1;
    const sameCategory = event.category === category;
    const sameMerchant = event.merchant?.trim().toLowerCase() === normalizedMerchant;
    return score + (sameCategory ? weight * decay : 0) + (sameMerchant ? 2 * decay : 0);
  }, 0);
}
