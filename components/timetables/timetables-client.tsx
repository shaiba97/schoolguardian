"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSelectedChild } from "@/hooks/use-selected-child";
import { getWardTimetable } from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type { WardTimetable } from "@/lib/api/types";
import { formatTime } from "@/lib/utils";

const GRID_DAYS = ["MON", "TUE", "WED", "THU", "SAT"] as const;
const GRID_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const DAY_LABEL_KEYS = {
  MON: "mon",
  TUE: "tue",
  WED: "wed",
  THU: "thu",
  SAT: "sat",
} as const;

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

function periodLabel(slot: number, locale: string, periodWord: string): string {
  if (locale !== "en") return `${periodWord} ${slot}`;
  const remainder = slot % 100;
  if (remainder >= 11 && remainder <= 13) return `${slot}th`;
  switch (slot % 10) {
    case 1:
      return `${slot}st`;
    case 2:
      return `${slot}nd`;
    case 3:
      return `${slot}rd`;
    default:
      return `${slot}th`;
  }
}

export function TimetablesClient() {
  const t = useTranslations("timetables");
  const tChildren = useTranslations("children");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { children, selected, selectedId, loaded: childrenLoaded } = useSelectedChild();
  const [data, setData] = React.useState<WardTimetable | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback((childId: string) => {
    if (!childId) {
      setLoading(false);
      return;
    }
    getWardTimetable(childId).then(
      (res) => {
        setData(res);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load timetable"));
        setLoading(false);
      },
    );
  }, []);

  React.useEffect(() => {
    if (!childrenLoaded) return;
    setLoading(true);
    load(selectedId);
  }, [childrenLoaded, selectedId, load]);

  function handleRetry() {
    setLoading(true);
    load(selectedId);
  }

  if (!childrenLoaded || (loading && !data)) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mt-2 text-sm font-medium">{tChildren("noChildren")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tChildren("noChildrenHint")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
            {tCommon("retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const childName = selected?.fullName ?? "";
  const cellOf = new Map(data.entries.map((entry) => [`${entry.dayOfWeek}:${entry.periodNo}`, entry]));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {tChildren("viewing", { name: childName })} · {data.class.className}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      {data.entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Table2 size={20} className="mx-auto text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium">{t("noEntries")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table aria-label={t("title")} className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky start-0 min-w-20 bg-background">
                    {data.class.className}
                  </TableHead>
                  {GRID_PERIODS.map((slot) => (
                    <TableHead key={slot} className="min-w-28 text-center">
                      {periodLabel(slot, locale, t("period"))}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {GRID_DAYS.map((day) => (
                  <TableRow key={day}>
                    <TableHead className="sticky start-0 bg-background font-semibold">
                      {t(DAY_LABEL_KEYS[day])}
                    </TableHead>
                    {GRID_PERIODS.map((slot) => {
                      const entry = cellOf.get(`${day}:${slot}`);
                      if (!entry) {
                        return (
                          <TableCell key={slot} className="text-center text-muted-foreground">
                            —
                          </TableCell>
                        );
                      }
                      if (entry.isBreak) {
                        return (
                          <TableCell key={slot} className="bg-[#E0E7FF]/80 text-center">
                            <p className="text-xs font-medium">{t("break")}</p>
                            <p className="text-[11px] tabular-nums text-muted-foreground">
                              {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                            </p>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={slot} className={cn("min-w-28 align-top")}>
                          <p className="text-[13px] font-medium leading-snug">
                            {entry.subjectName ?? tCommon("noData")}
                          </p>
                          {entry.teacherName && (
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {entry.teacherName}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                            {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                          </p>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
