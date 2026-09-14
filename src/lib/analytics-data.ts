/**
 * Deterministic sample dataset for the artist analytics dashboard.
 * All figures are synthetic and generated locally — they are illustrative
 * modelling data, not real reported business performance.
 */

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Market = {
  id: string;
  city: string;
  country: string;
  region: "South Africa" | "Africa" | "International";
  lat: number;
  lng: number;
  base: number;
  growth: number; // weekly trend strength
  eventIndex: number; // 0-1, how much live activity the market has had
};

export const markets: Market[] = [
  { id: "jhb", city: "Johannesburg", country: "South Africa", region: "South Africa", lat: -26.2, lng: 28.05, base: 42000, growth: 1.9, eventIndex: 0.32 },
  { id: "cpt", city: "Cape Town", country: "South Africa", region: "South Africa", lat: -33.92, lng: 18.42, base: 31000, growth: 1.4, eventIndex: 0.71 },
  { id: "dbn", city: "Durban", country: "South Africa", region: "South Africa", lat: -29.86, lng: 31.02, base: 19500, growth: 1.1, eventIndex: 0.55 },
  { id: "pta", city: "Pretoria", country: "South Africa", region: "South Africa", lat: -25.75, lng: 28.19, base: 14800, growth: 1.3, eventIndex: 0.28 },
  { id: "pe", city: "Gqeberha", country: "South Africa", region: "South Africa", lat: -33.96, lng: 25.6, base: 8200, growth: 0.7, eventIndex: 0.18 },
  { id: "lag", city: "Lagos", country: "Nigeria", region: "Africa", lat: 6.52, lng: 3.38, base: 17600, growth: 2.3, eventIndex: 0.24 },
  { id: "nbo", city: "Nairobi", country: "Kenya", region: "Africa", lat: -1.29, lng: 36.82, base: 9100, growth: 1.7, eventIndex: 0.15 },
  { id: "acc", city: "Accra", country: "Ghana", region: "Africa", lat: 5.6, lng: -0.19, base: 7300, growth: 1.5, eventIndex: 0.12 },
  { id: "ldn", city: "London", country: "United Kingdom", region: "International", lat: 51.51, lng: -0.13, base: 15400, growth: 0.9, eventIndex: 0.49 },
  { id: "nyc", city: "New York", country: "United States", region: "International", lat: 40.71, lng: -74.01, base: 12700, growth: 1.2, eventIndex: 0.44 },
  { id: "atl", city: "Atlanta", country: "United States", region: "International", lat: 33.75, lng: -84.39, base: 9800, growth: 1.6, eventIndex: 0.33 },
  { id: "ber", city: "Berlin", country: "Germany", region: "International", lat: 52.52, lng: 13.4, base: 5600, growth: 0.6, eventIndex: 0.21 },
];

export type Release = {
  id: string;
  title: string;
  type: "Album" | "Single" | "EP" | "Feature";
  date: string; // ISO
  week: number; // index into the weekly series
  collaborators: string[];
};

export const WEEKS = 104;
const START = new Date(Date.UTC(2024, 8, 2)); // 104 weeks back from mid-2026

export function weekDate(week: number) {
  const d = new Date(START);
  d.setUTCDate(d.getUTCDate() + week * 7);
  return d;
}

export function weekLabel(week: number) {
  return weekDate(week).toISOString().slice(0, 10);
}

export const releases: Release[] = [
  { id: "r1", title: "Gravity Shift", type: "Single", date: weekLabel(9), week: 9, collaborators: ["Sjava"] },
  { id: "r2", title: "Night Runner", type: "Single", date: weekLabel(21), week: 21, collaborators: [] },
  { id: "r3", title: "Zulu Man Rising", type: "Album", date: weekLabel(32), week: 32, collaborators: ["Sjava", "Rowlene", "ASAP Ferg"] },
  { id: "r4", title: "Palm Lines", type: "EP", date: weekLabel(49), week: 49, collaborators: ["Tellaman"] },
  { id: "r5", title: "Crossfire (feat.)", type: "Feature", date: weekLabel(58), week: 58, collaborators: ["Burna Boy"] },
  { id: "r6", title: "Loud Silence", type: "Single", date: weekLabel(71), week: 71, collaborators: ["Rowlene"] },
  { id: "r7", title: "Continental", type: "Album", date: weekLabel(86), week: 86, collaborators: ["Burna Boy", "Tems", "Blxckie"] },
  { id: "r8", title: "Afterglow", type: "Single", date: weekLabel(97), week: 97, collaborators: ["Blxckie"] },
];

export type WeeklyPoint = {
  week: number;
  date: string;
  marketId: string;
  streams: number;
  listeners: number;
  followers: number;
  engagements: number;
  eventDemand: number;
  saves: number;
};

function releaseLift(week: number) {
  let lift = 0;
  for (const r of releases) {
    const d = week - r.week;
    if (d < -1 || d > 14) continue;
    const peak = r.type === "Album" ? 1.15 : r.type === "EP" ? 0.7 : r.type === "Feature" ? 0.45 : 0.55;
    lift += d < 0 ? peak * 0.15 : peak * Math.exp(-d / 4.2);
  }
  return lift;
}

function buildSeries(): WeeklyPoint[] {
  const rnd = mulberry32(20260914);
  const out: WeeklyPoint[] = [];
  for (const m of markets) {
    let momentum = 1;
    for (let w = 0; w < WEEKS; w++) {
      const trend = 1 + (m.growth / 100) * w;
      const season = 1 + 0.09 * Math.sin((w / 52) * Math.PI * 2 - 0.7);
      const noise = 0.93 + rnd() * 0.14;
      const lift = 1 + releaseLift(w) * (0.6 + m.growth / 4);
      momentum = momentum * 0.86 + (lift - 1) * 0.3 + 0.14;
      const streams = Math.round(m.base * trend * season * noise * lift);
      const listeners = Math.round(streams * (0.28 + rnd() * 0.05));
      const followers = Math.round(listeners * (0.11 + m.growth / 90));
      const engagements = Math.round(
        listeners * (0.16 + m.eventIndex * 0.09) * (0.9 + rnd() * 0.25) * (0.8 + momentum * 0.2),
      );
      const eventDemand = Math.round(listeners * (0.02 + m.eventIndex * 0.06) * (0.85 + rnd() * 0.3));
      const saves = Math.round(streams * (0.04 + rnd() * 0.02));
      out.push({ week: w, date: weekLabel(w), marketId: m.id, streams, listeners, followers, engagements, eventDemand, saves });
    }
  }
  return out;
}

export const weekly: WeeklyPoint[] = buildSeries();

export type AgeSegment = { segment: string; share: number; growth: number; engagementRate: number };
export const ageSegments: AgeSegment[] = [
  { segment: "13-17", share: 9, growth: 6.2, engagementRate: 21.4 },
  { segment: "18-24", share: 38, growth: 14.8, engagementRate: 26.9 },
  { segment: "25-34", share: 32, growth: 9.1, engagementRate: 19.7 },
  { segment: "35-44", share: 15, growth: 3.4, engagementRate: 12.8 },
  { segment: "45+", share: 6, growth: 1.1, engagementRate: 8.3 },
];

export type Persona = {
  id: string;
  name: string;
  size: number;
  streamsPerWeek: number;
  engagementRate: number;
  eventPropensity: number;
  topMarket: string;
  description: string;
};

export const personas: Persona[] = [
  { id: "p1", name: "Core superfans", size: 84000, streamsPerWeek: 41, engagementRate: 38, eventPropensity: 72, topMarket: "Johannesburg", description: "Streams every release in week one, buys merch, follows on every platform." },
  { id: "p2", name: "Playlist drifters", size: 412000, streamsPerWeek: 6, engagementRate: 7, eventPropensity: 9, topMarket: "London", description: "Discovers through editorial playlists, rarely follows the artist page." },
  { id: "p3", name: "Live-first fans", size: 63000, streamsPerWeek: 14, engagementRate: 24, eventPropensity: 81, topMarket: "Cape Town", description: "Low streaming volume but high ticket and festival conversion." },
  { id: "p4", name: "Continental crossover", size: 137000, streamsPerWeek: 11, engagementRate: 17, eventPropensity: 22, topMarket: "Lagos", description: "Came in through pan-African features and collaborations." },
  { id: "p5", name: "Lapsing listeners", size: 96000, streamsPerWeek: 2, engagementRate: 3, eventPropensity: 5, topMarket: "Durban", description: "Active last year, now down more than 60% in weekly streams." },
];

export type Collaborator = {
  name: string;
  tracks: number;
  avgStreamLift: number; // % lift vs baseline
  newListeners: number;
  audienceOverlap: number; // %
  markets: string[];
};

export const collaborators: Collaborator[] = [
  { name: "Burna Boy", tracks: 3, avgStreamLift: 64, newListeners: 218000, audienceOverlap: 31, markets: ["Lagos", "London", "Accra"] },
  { name: "Rowlene", tracks: 5, avgStreamLift: 28, newListeners: 74000, audienceOverlap: 62, markets: ["Johannesburg", "Cape Town"] },
  { name: "Sjava", tracks: 4, avgStreamLift: 35, newListeners: 96000, audienceOverlap: 48, markets: ["Durban", "Johannesburg"] },
  { name: "Blxckie", tracks: 2, avgStreamLift: 41, newListeners: 88000, audienceOverlap: 44, markets: ["Durban", "Johannesburg"] },
  { name: "Tems", tracks: 1, avgStreamLift: 58, newListeners: 154000, audienceOverlap: 19, markets: ["Lagos", "New York"] },
  { name: "Tellaman", tracks: 3, avgStreamLift: 19, newListeners: 41000, audienceOverlap: 57, markets: ["Durban", "Pretoria"] },
  { name: "ASAP Ferg", tracks: 1, avgStreamLift: 47, newListeners: 129000, audienceOverlap: 12, markets: ["New York", "Atlanta"] },
];

/* ------------------------------- aggregation ------------------------------ */

export type Metric = "streams" | "listeners" | "followers" | "engagements" | "eventDemand" | "saves";

export const metricLabels: Record<Metric, string> = {
  streams: "Streams",
  listeners: "Monthly listeners",
  followers: "Followers",
  engagements: "Engagements",
  eventDemand: "Event demand signal",
  saves: "Saves",
};

export function filterPoints(marketIds: string[], weeks: number) {
  const from = WEEKS - weeks;
  return weekly.filter((p) => p.week >= from && (marketIds.length === 0 || marketIds.includes(p.marketId)));
}

export function seriesByWeek(points: WeeklyPoint[]) {
  const map = new Map<number, WeeklyPoint>();
  for (const p of points) {
    const cur = map.get(p.week);
    if (!cur) {
      map.set(p.week, { ...p, marketId: "all" });
    } else {
      cur.streams += p.streams;
      cur.listeners += p.listeners;
      cur.followers += p.followers;
      cur.engagements += p.engagements;
      cur.eventDemand += p.eventDemand;
      cur.saves += p.saves;
    }
  }
  return [...map.values()].sort((a, b) => a.week - b.week);
}

export function totalsByMarket(points: WeeklyPoint[]) {
  const map = new Map<string, { marketId: string; streams: number; listeners: number; engagements: number; eventDemand: number; followers: number }>();
  for (const p of points) {
    const cur = map.get(p.marketId) ?? { marketId: p.marketId, streams: 0, listeners: 0, engagements: 0, eventDemand: 0, followers: 0 };
    cur.streams += p.streams;
    cur.listeners += p.listeners;
    cur.engagements += p.engagements;
    cur.eventDemand += p.eventDemand;
    cur.followers += p.followers;
    map.set(p.marketId, cur);
  }
  return [...map.values()];
}

export function sum(points: WeeklyPoint[], metric: Metric) {
  return points.reduce((a, p) => a + p[metric], 0);
}

/** Percentage change of the latest half vs the previous half of the window. */
export function periodChange(series: WeeklyPoint[], metric: Metric) {
  if (series.length < 4) return 0;
  const mid = Math.floor(series.length / 2);
  const prev = series.slice(0, mid).reduce((a, p) => a + p[metric], 0);
  const cur = series.slice(mid).reduce((a, p) => a + p[metric], 0);
  if (prev === 0) return 0;
  return ((cur - prev) / prev) * 100;
}

/* -------------------------------- forecast -------------------------------- */

/**
 * Ordinary least-squares trend on the log of the metric, projected forward with
 * a widening uncertainty band. Defensible only as a naive trend continuation.
 */
export function forecast(series: WeeklyPoint[], metric: Metric, horizon = 12) {
  const ys = series.map((p) => Math.log(Math.max(1, p[metric])));
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  const resid = ys.map((y, i) => y - (intercept + slope * i));
  const sigma = Math.sqrt(resid.reduce((a, r) => a + r * r, 0) / Math.max(1, n - 2));

  const history = series.map((p) => ({ date: p.date, actual: p[metric] as number, projected: null as number | null, low: null as number | null, high: null as number | null }));
  const lastWeek = series[series.length - 1].week;
  const out = [...history];
  out[out.length - 1] = { ...out[out.length - 1], projected: series[series.length - 1][metric], low: series[series.length - 1][metric], high: series[series.length - 1][metric] };
  for (let h = 1; h <= horizon; h++) {
    const i = n - 1 + h;
    const mean = intercept + slope * i;
    const band = sigma * 1.645 * Math.sqrt(1 + h / 6);
    out.push({
      date: weekLabel(lastWeek + h),
      actual: null as unknown as number,
      projected: Math.round(Math.exp(mean)),
      low: Math.round(Math.exp(mean - band)),
      high: Math.round(Math.exp(mean + band)),
    });
  }
  const weeklyGrowth = (Math.exp(slope) - 1) * 100;
  return { data: out, weeklyGrowth, r2: den === 0 ? 0 : 1 - resid.reduce((a, r) => a + r * r, 0) / ys.reduce((a, y) => a + (y - my) ** 2, 0) };
}

/* ------------------------------ release impact ---------------------------- */

export function releaseImpact(marketIds: string[] = []) {
  const points = weekly.filter((p) => marketIds.length === 0 || marketIds.includes(p.marketId));
  const byWeek = seriesByWeek(points);
  return releases.map((r) => {
    const pre = byWeek.filter((p) => p.week >= r.week - 4 && p.week < r.week);
    const post = byWeek.filter((p) => p.week >= r.week && p.week < r.week + 4);
    const avg = (arr: WeeklyPoint[], k: Metric) => (arr.length ? arr.reduce((a, p) => a + p[k], 0) / arr.length : 0);
    const preStreams = avg(pre, "streams");
    const postStreams = avg(post, "streams");
    const preEng = avg(pre, "engagements");
    const postEng = avg(post, "engagements");
    const decay = byWeek.filter((p) => p.week >= r.week + 8 && p.week < r.week + 12);
    const retained = preStreams ? (avg(decay, "streams") / preStreams - 1) * 100 : 0;
    return {
      ...r,
      streamLift: preStreams ? ((postStreams - preStreams) / preStreams) * 100 : 0,
      engagementLift: preEng ? ((postEng - preEng) / preEng) * 100 : 0,
      retainedLift: retained,
      peakWeeklyStreams: Math.max(...post.map((p) => p.streams), 0),
    };
  });
}

/* -------------------------------- KPI helpers ----------------------------- */

export function formatNumber(n: number) {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

export function formatPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export const marketById = Object.fromEntries(markets.map((m) => [m.id, m])) as Record<string, Market>;
