import {
  markets,
  marketById,
  weekly,
  seriesByWeek,
  periodChange,
  releaseImpact,
  collaborators,
  personas,
  type Metric,
} from "./analytics-data";

export type Recommendation = {
  id: string;
  opportunity: string;
  market?: string;
  detail: string;
  experiment: string;
  signal: string;
  confidence: "High" | "Medium" | "Exploratory";
  effort: "Low" | "Medium" | "High";
  score: number;
};

const recentWeeks = 26;

function marketStats(marketId: string) {
  const pts = weekly.filter((p) => p.marketId === marketId && p.week >= 104 - recentWeeks);
  const series = seriesByWeek(pts);
  const growth = (m: Metric) => periodChange(series, m);
  const totals = (m: Metric) => series.reduce((a, p) => a + p[m], 0);
  return {
    id: marketId,
    city: marketById[marketId]!.city,
    streamGrowth: growth("streams"),
    audienceGrowth: growth("listeners"),
    engagementGrowth: growth("engagements"),
    eventPerListener: totals("eventDemand") / Math.max(1, totals("listeners")),
    engagementRate: totals("engagements") / Math.max(1, totals("listeners")),
    streams: totals("streams"),
    listeners: totals("listeners"),
  };
}

export function buildRecommendations(): Recommendation[] {
  const stats = markets.map((m) => marketStats(m.id));
  const medianEvent = [...stats].sort((a, b) => a.eventPerListener - b.eventPerListener)[Math.floor(stats.length / 2)]!.eventPerListener;
  const recs: Recommendation[] = [];

  // 1. Growing audience, under-served live activity
  for (const s of stats) {
    if (s.audienceGrowth > 4 && s.eventPerListener < medianEvent) {
      recs.push({
        id: `live-${s.id}`,
        opportunity: `${s.city} shows sustained audience growth but relatively low event activity`,
        market: s.city,
        detail: `Listeners up ${s.audienceGrowth.toFixed(1)}% over the last ${recentWeeks} weeks, while event-demand per listener sits ${(((medianEvent - s.eventPerListener) / medianEvent) * 100).toFixed(0)}% below the median market.`,
        experiment: `Run a ${s.city}-focused promotional campaign in the four weeks before the next release, weighted toward live/ticketing messaging.`,
        signal: `Compare engagement rate and streaming growth in ${s.city} against comparable markets over the campaign window and the four weeks after.`,
        confidence: s.audienceGrowth > 8 ? "High" : "Medium",
        effort: "Medium",
        score: s.audienceGrowth * 1.6 + ((medianEvent - s.eventPerListener) / medianEvent) * 40,
      });
    }
  }

  // 2. Engagement lagging streams — attention without connection
  for (const s of stats) {
    if (s.streamGrowth > 3 && s.engagementGrowth < s.streamGrowth - 4) {
      recs.push({
        id: `eng-${s.id}`,
        opportunity: `${s.city} is streaming more but engaging less`,
        market: s.city,
        detail: `Streams up ${s.streamGrowth.toFixed(1)}% while engagement moved ${s.engagementGrowth.toFixed(1)}% — growth is arriving through passive playlist placement.`,
        experiment: "Test a two-week behind-the-scenes content sequence targeted at this market to convert passive listeners into followers.",
        signal: "Watch follower conversion per 1,000 listeners and saves-per-stream versus the pre-test baseline.",
        confidence: "Medium",
        effort: "Low",
        score: (s.streamGrowth - s.engagementGrowth) * 2,
      });
    }
  }

  // 3. Release cadence
  const impact = releaseImpact();
  const best = [...impact].sort((a, b) => b.retainedLift - a.retainedLift)[0]!;
  const worst = [...impact].sort((a, b) => a.streamLift - b.streamLift)[0]!;
  recs.push({
    id: "cadence",
    opportunity: `"${best.title}" retained lift better than any other release`,
    detail: `Eight to twelve weeks after release, streams were still ${best.retainedLift.toFixed(0)}% above the pre-release baseline, versus ${worst.streamLift.toFixed(0)}% peak lift for "${worst.title}".`,
    experiment: `Rebuild the next rollout around the ${best.type.toLowerCase()} pattern: same pre-release lead time and collaborator mix.`,
    signal: "Compare week 8-12 retained lift of the next release against this benchmark.",
    confidence: "High",
    effort: "Medium",
    score: best.retainedLift,
  });

  // 4. Collaborations
  const topCollab = [...collaborators].sort((a, b) => b.newListeners / Math.max(1, b.audienceOverlap) - a.newListeners / Math.max(1, a.audienceOverlap))[0]!;
  recs.push({
    id: "collab",
    opportunity: `${topCollab.name} brings reach with minimal audience overlap`,
    detail: `${topCollab.newListeners.toLocaleString()} new listeners at only ${topCollab.audienceOverlap}% audience overlap — the most incremental partner in the set.`,
    experiment: `Plan one more ${topCollab.name} collaboration and route promotion through ${topCollab.markets.join(", ")}.`,
    signal: "Track net-new listeners in those markets in the 30 days after release, excluding existing followers.",
    confidence: "Medium",
    effort: "High",
    score: 55,
  });

  // 5. Lapsing segment
  const lapsing = personas.find((p) => p.id === "p5")!;
  recs.push({
    id: "reactivation",
    opportunity: "A large lapsing segment is still reachable",
    detail: `${lapsing.size.toLocaleString()} listeners average ${lapsing.streamsPerWeek} streams per week, down sharply year over year, concentrated in ${lapsing.topMarket}.`,
    experiment: "Test a reactivation push: a throwback catalogue playlist plus one direct message sequence to this segment only.",
    signal: "Measure 30-day return-to-listen rate against a held-out control group from the same segment.",
    confidence: "Exploratory",
    effort: "Low",
    score: 40,
  });

  return recs.sort((a, b) => b.score - a.score);
}
