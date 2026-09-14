import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FilterBar } from "@/components/dashboard/Filters";
import { KpiCard, ModelNotice, PageHeader, Panel, Section } from "@/components/dashboard/primitives";
import { useFilters } from "@/components/dashboard/useFilters";
import {
  forecast,
  formatNumber,
  metricLabels,
  periodChange,
  releases,
  sum,
  type Metric,
} from "@/lib/analytics-data";
import { buildRecommendations } from "@/lib/recommendations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Artist Analytics Overview | Audience, Streams & Growth" },
      {
        name: "description",
        content:
          "Interactive artist analytics dashboard: KPI trends, audience segments, geographic demand and a growth simulator built on synthetic sample data.",
      },
      { property: "og:title", content: "Artist Analytics Overview" },
      {
        property: "og:description",
        content: "KPI trends, forecasts and decision recommendations from a synthetic artist dataset.",
      },
    ],
  }),
  component: Overview,
});

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
};

function Overview() {
  const f = useFilters(52);
  const [metric, setMetric] = useState<Metric>("streams");

  const kpis = useMemo(() => {
    const items: { metric: Metric; hint: string }[] = [
      { metric: "streams", hint: "vs previous period" },
      { metric: "listeners", hint: "unique in period" },
      { metric: "engagements", hint: "likes, shares, comments" },
      { metric: "eventDemand", hint: "ticket-intent signal" },
    ];
    return items.map((i) => ({
      label: metricLabels[i.metric],
      value: formatNumber(sum(f.points, i.metric)),
      change: periodChange(f.series, i.metric),
      hint: i.hint,
    }));
  }, [f.points, f.series]);

  const fc = useMemo(() => forecast(f.series, metric, 12), [f.series, metric]);
  const recs = useMemo(() => buildRecommendations().slice(0, 2), []);

  const chartData = f.series.map((p) => ({
    date: p.date,
    streams: p.streams,
    engagements: p.engagements,
    listeners: p.listeners,
  }));

  const releaseMarkers = releases.filter((r) => f.series.some((s) => s.week === r.week));

  return (
    <>
      <PageHeader
        title="Artist growth overview"
        lead="A working analytics environment for an artist's audience, catalogue and touring footprint — built on a synthetic 104-week dataset so every chart, filter and scenario is fully explorable."
      >
        <FilterBar
          selected={f.selected}
          onToggleMarket={f.toggleMarket}
          onClearMarkets={f.clearMarkets}
          weeks={f.weeks}
          onWeeks={f.setWeeks}
        />
      </PageHeader>

      <Section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        <Panel
          title="Weekly performance"
          subtitle={`${f.series.length} weeks${f.selected.length ? ` · ${f.selected.length} market(s) selected` : " · all markets"}`}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gStreams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" minTickGap={40} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={formatNumber} width={52} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNumber(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="streams" name="Streams" stroke="var(--chart-1)" fill="url(#gStreams)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagements" name="Engagements" stroke="var(--chart-2)" fill="url(#gEng)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {releaseMarkers.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Releases in this window: {releaseMarkers.map((r) => `${r.title} (${r.date})`).join(" · ")}
            </p>
          )}
        </Panel>

        <Panel
          title="12-week trend projection"
          subtitle={`Log-linear trend continuation with a 90% band · weekly trend ${fc.weeklyGrowth.toFixed(2)}% · fit R² ${fc.r2.toFixed(2)}`}
          action={
            <div className="flex flex-wrap gap-1">
              {(["streams", "listeners", "engagements", "eventDemand"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    metric === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {metricLabels[m]}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fc.data} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" minTickGap={40} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={formatNumber} width={52} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNumber(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="var(--chart-1)" strokeWidth={2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="projected" name="Projected" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                <Line type="monotone" dataKey="low" name="Low band" stroke="var(--chart-2)" strokeWidth={1} strokeOpacity={0.4} dot={false} connectNulls />
                <Line type="monotone" dataKey="high" name="High band" stroke="var(--chart-2)" strokeWidth={1} strokeOpacity={0.4} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ModelNotice className="mt-4" />
        </Panel>

        <Panel title="Top decisions right now" subtitle="Generated from the current dataset — full list on the Decisions page">
          <div className="grid gap-4 md:grid-cols-2">
            {recs.map((r) => (
              <article key={r.id} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                  Opportunity detected
                </p>
                <h3 className="mt-1 text-sm font-semibold text-foreground">{r.opportunity}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{r.detail}</p>
                <p className="mt-3 text-xs text-foreground">
                  <span className="font-semibold">Recommended experiment: </span>
                  {r.experiment}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/decisions"
              className="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              See all recommendations
            </Link>
            <Link
              to="/simulator"
              className="inline-flex items-center rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open the Growth Simulator
            </Link>
          </div>
        </Panel>
      </Section>
    </>
  );
}
