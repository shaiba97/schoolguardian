"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Line, LineChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDelta, getTrendVerdict, type TrendVerdict } from "./trend";
import type { TrendPoint } from "@/lib/api/types";

const VERDICT_META: Record<
  TrendVerdict,
  { labelKey: "improving" | "declining" | "stable"; Icon: typeof TrendingUp }
> = {
  improving: { labelKey: "improving", Icon: TrendingUp },
  declining: { labelKey: "declining", Icon: TrendingDown },
  stable: { labelKey: "stable", Icon: Minus },
};

// Base-nova badge set has no success/muted/info variants: improving takes
// the primary default, declining destructive, stable outline.
function verdictVariant(verdict: TrendVerdict): "default" | "destructive" | "outline" {
  if (verdict === "improving") return "default";
  if (verdict === "declining") return "destructive";
  return "outline";
}

/**
 * Shared verdict + delta + sparkline, used by Results, Attendance and the
 * Dashboard. Fixed-size chart (no ResizeObserver) so it prerenders
 * deterministically and never causes a hydration mismatch.
 */
export function TrendIndicator({
  delta,
  series,
  className,
}: {
  delta: number | null | undefined;
  series: TrendPoint[];
  className?: string;
}) {
  const t = useTranslations("trends");
  const verdict = getTrendVerdict(delta);
  if (verdict === null) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>{t("notEnoughHistory")}</span>
    );
  }
  const { labelKey, Icon } = VERDICT_META[verdict];
  const points = series.map((point, index) => ({
    index,
    value: point.value ?? null,
  }));

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Badge variant={verdictVariant(verdict)}>
        <Icon size={12} aria-hidden />
        {t(labelKey)}
      </Badge>
      <span className="shrink-0 text-xs font-medium tabular-nums">{formatDelta(delta)}</span>
      {points.length > 1 && (
        <span aria-hidden="true">
          <LineChart
            width={112}
            height={36}
            data={points}
            margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
          >
            <Line
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={2}
              dot={false}
              connectNulls
              isAnimationActive={false}
              className="text-primary"
            />
          </LineChart>
        </span>
      )}
    </span>
  );
}
