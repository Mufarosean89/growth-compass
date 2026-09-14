import { useMemo, useState } from "react";
import { filterPoints, seriesByWeek, totalsByMarket } from "@/lib/analytics-data";

export function useFilters(initialWeeks = 52) {
  const [selected, setSelected] = useState<string[]>([]);
  const [weeks, setWeeks] = useState(initialWeeks);

  const toggleMarket = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const clearMarkets = () => setSelected([]);

  const points = useMemo(() => filterPoints(selected, weeks), [selected, weeks]);
  const series = useMemo(() => seriesByWeek(points), [points]);
  const byMarket = useMemo(() => totalsByMarket(points), [points]);

  return { selected, weeks, setWeeks, toggleMarket, clearMarkets, points, series, byMarket };
}
