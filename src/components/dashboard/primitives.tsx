import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatPct } from "@/lib/analytics-data";

export function PageHeader({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{lead}</p>
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </header>
  );
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Panel({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-5", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  change,
  hint,
}: {
  label: string;
  value: string;
  change?: number;
  hint?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div
      className="rounded-xl border border-border bg-card p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {change !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
              positive ? "bg-accent-soft text-accent-foreground" : "bg-destructive/10 text-destructive",
            )}
            style={positive ? { color: "var(--accent)" } : undefined}
          >
            {formatPct(change)}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function ModelNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <strong className="font-semibold text-foreground">Model, not a prediction.</strong> Figures shown here
      come from a synthetic sample dataset and illustrative models. They are experiments for exploring
      decisions, not statements about Nasty C&apos;s actual business performance.
    </p>
  );
}

export const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
