import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard, ModelNotice, PageHeader, Panel, Section, chartColors } from "@/components/dashboard/primitives";
import { ageSegments, formatNumber, personas } from "@/lib/analytics-data";

export const Route = createFileRoute("/audience")({
  head: () => ({
    meta: [
      { title: "Audience Segmentation | Artist Analytics" },
      {
        name: "description",
        content:
          "Segment the artist's audience by age, behaviour and persona: superfans, playlist drifters, live-first fans and lapsing listeners.",
      },
      { property: "og:title", content: "Audience Segmentation" },
      {
        property: "og:description",
        content: "Age mix, persona sizing and engagement quality across the artist's listener base.",
      },
    ],
  }),
  component: Audience,
});

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
};

function Audience() {
  const total = personas.reduce((a, p) => a + p.size, 0);
  const engagedShare =
    personas.reduce((a, p) => a + (p.size * p.engagementRate) / 100, 0) / total;
  const eventShare = personas.reduce((a, p) => a + (p.size * p.eventPropensity) / 100, 0) / total;

  const radarData = personas.map((p) => ({
    persona: p.name,
    Engagement: p.engagementRate,
    "Event intent": p.eventPropensity,
    "Stream intensity": p.streamsPerWeek * 2,
  }));

  return (
    <>
      <PageHeader
        title="Audience segmentation"
        lead="Who is actually listening, how intensely they engage, and which groups convert into live demand."
      />
      <Section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Reachable audience" value={formatNumber(total)} hint="across five personas" />
          <KpiCard label="Weighted engagement rate" value={`${(engagedShare * 100).toFixed(1)}%`} change={2.8} />
          <KpiCard label="Event propensity" value={`${(eventShare * 100).toFixed(1)}%`} change={5.1} />
          <KpiCard label="18-34 share of audience" value="70%" change={4.4} hint="core demographic" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Age distribution" subtitle="Share of audience and year-on-year growth by band">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageSegments} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="segment" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="share" name="Share %" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="growth" name="Growth %" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagementRate" name="Engagement %" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Persona mix" subtitle="Relative size of each behavioural segment">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={personas} dataKey="size" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {personas.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatNumber(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Segment quality" subtitle="Engagement, event intent and streaming intensity by persona">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={120}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="persona" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Radar dataKey="Engagement" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
                <Radar dataKey="Event intent" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.2} />
                <Radar dataKey="Stream intensity" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Persona detail">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Persona</th>
                  <th className="py-2 pr-4 font-medium">Size</th>
                  <th className="py-2 pr-4 font-medium">Streams / week</th>
                  <th className="py-2 pr-4 font-medium">Engagement</th>
                  <th className="py-2 pr-4 font-medium">Event intent</th>
                  <th className="py-2 pr-4 font-medium">Top market</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="mt-0.5 max-w-sm text-xs text-muted-foreground">{p.description}</div>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(p.size)}</td>
                    <td className="py-3 pr-4 tabular-nums">{p.streamsPerWeek}</td>
                    <td className="py-3 pr-4 tabular-nums">{p.engagementRate}%</td>
                    <td className="py-3 pr-4 tabular-nums">{p.eventPropensity}%</td>
                    <td className="py-3 pr-4">{p.topMarket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ModelNotice className="mt-4" />
        </Panel>
      </Section>
    </>
  );
}
