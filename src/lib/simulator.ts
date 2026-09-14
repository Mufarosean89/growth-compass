import { marketById, seriesByWeek, weekly, weekLabel, WEEKS } from "./analytics-data";

export type ScenarioInput = {
  releaseType: "none" | "single" | "ep" | "album" | "feature";
  markets: string[];
  campaignWeeks: number;
  budgetIndex: number; // 1-10 relative spend intensity
  contentCadence: number; // posts per week, 0-14
  collaborator: string; // "" for none
  liveDates: number; // number of announced shows
};

export const defaultScenario: ScenarioInput = {
  releaseType: "single",
  markets: ["jhb", "cpt"],
  campaignWeeks: 4,
  budgetIndex: 5,
  contentCadence: 4,
  collaborator: "",
  liveDates: 0,
};

const releaseWeight: Record<ScenarioInput["releaseType"], number> = {
  none: 0,
  single: 0.55,
  ep: 0.8,
  album: 1.2,
  feature: 0.45,
};

export type SimPoint = {
  week: string;
  baselineStreams: number;
  scenarioStreams: number;
  baselineAudience: number;
  scenarioAudience: number;
  baselineEngagement: number;
  scenarioEngagement: number;
  baselineEventDemand: number;
  scenarioEventDemand: number;
};

export type SimResult = {
  points: SimPoint[];
  deltas: { key: string; label: string; baseline: number; scenario: number; pct: number }[];
  horizon: number;
};

/**
 * Simple additive-impulse model. Baseline is the trend continuation of the
 * selected markets; the scenario applies a decaying release impulse plus a
 * sustained campaign effect with diminishing returns on spend.
 */
export function simulate(input: ScenarioInput, horizon = 16): SimResult {
  const ids = input.markets.length ? input.markets : Object.keys(marketById);
  const history = seriesByWeek(weekly.filter((p) => ids.includes(p.marketId) && p.week >= WEEKS - 26));
  const last = history[history.length - 1]!;
  const first = history[0]!;
  const weeklyTrend = Math.pow(last.streams / Math.max(1, first.streams), 1 / Math.max(1, history.length - 1));

  const reach = ids.reduce((a, id) => a + marketById[id]!.base, 0) / 100000;
  const spend = Math.log1p(input.budgetIndex) / Math.log1p(10); // diminishing returns 0-1
  const cadence = Math.min(1, input.contentCadence / 10);
  const collabBoost = input.collaborator ? 0.22 : 0;
  const liveBoost = Math.min(0.35, input.liveDates * 0.06);
  const impulsePeak = releaseWeight[input.releaseType] * (0.6 + spend * 0.8) + collabBoost;

  const points: SimPoint[] = [];
  for (let h = 1; h <= horizon; h++) {
    const growth = Math.pow(weeklyTrend, h);
    const baselineStreams = last.streams * growth;
    const baselineAudience = last.listeners * growth;
    const baselineEngagement = last.engagements * growth;
    const baselineEventDemand = last.eventDemand * growth;

    const inCampaign = h <= input.campaignWeeks;
    const campaign = inCampaign ? spend * 0.28 + cadence * 0.16 : (spend * 0.28 + cadence * 0.16) * Math.exp(-(h - input.campaignWeeks) / 6) * 0.45;
    const impulse = impulsePeak * Math.exp(-Math.max(0, h - 1) / 4.5);
    const streamMult = 1 + impulse + campaign * Math.min(1.2, reach / 2 + 0.6);
    const audienceMult = 1 + impulse * 0.55 + campaign * 0.8;
    const engagementMult = 1 + impulse * 0.7 + campaign * 1.15 + cadence * 0.1;
    const eventMult = 1 + impulse * 0.4 + campaign * 0.6 + liveBoost;

    points.push({
      week: weekLabel(WEEKS - 1 + h),
      baselineStreams: Math.round(baselineStreams),
      scenarioStreams: Math.round(baselineStreams * streamMult),
      baselineAudience: Math.round(baselineAudience),
      scenarioAudience: Math.round(baselineAudience * audienceMult),
      baselineEngagement: Math.round(baselineEngagement),
      scenarioEngagement: Math.round(baselineEngagement * engagementMult),
      baselineEventDemand: Math.round(baselineEventDemand),
      scenarioEventDemand: Math.round(baselineEventDemand * eventMult),
    });
  }

  const agg = (k: keyof SimPoint) => points.reduce((a, p) => a + (p[k] as number), 0);
  const pair = (key: string, label: string, b: keyof SimPoint, s: keyof SimPoint) => {
    const baseline = agg(b);
    const scenario = agg(s);
    return { key, label, baseline, scenario, pct: baseline ? ((scenario - baseline) / baseline) * 100 : 0 };
  };

  return {
    horizon,
    points,
    deltas: [
      pair("audience", "Audience growth", "baselineAudience", "scenarioAudience"),
      pair("engagement", "Engagement", "baselineEngagement", "scenarioEngagement"),
      pair("streams", "Streaming activity", "baselineStreams", "scenarioStreams"),
      pair("events", "Potential event demand", "baselineEventDemand", "scenarioEventDemand"),
    ],
  };
}
