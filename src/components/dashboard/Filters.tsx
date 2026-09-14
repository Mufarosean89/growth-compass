import { markets } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";

export const rangeOptions = [
  { label: "13 weeks", weeks: 13 },
  { label: "26 weeks", weeks: 26 },
  { label: "52 weeks", weeks: 52 },
  { label: "All (104w)", weeks: 104 },
];

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  selected,
  onToggleMarket,
  onClearMarkets,
  weeks,
  onWeeks,
}: {
  selected: string[];
  onToggleMarket: (id: string) => void;
  onClearMarkets: () => void;
  weeks: number;
  onWeeks: (w: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Markets</span>
        <Chip active={selected.length === 0} onClick={onClearMarkets}>
          All markets
        </Chip>
        {markets.map((m) => (
          <Chip key={m.id} active={selected.includes(m.id)} onClick={() => onToggleMarket(m.id)}>
            {m.city}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Period</span>
        {rangeOptions.map((r) => (
          <Chip key={r.weeks} active={weeks === r.weeks} onClick={() => onWeeks(r.weeks)}>
            {r.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
