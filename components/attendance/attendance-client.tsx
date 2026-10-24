"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeEvent } from "@/lib/realtime/socket";
import { TrendIndicator } from "@/components/trends/trend-indicator";
import { useSelectedChild } from "@/hooks/use-selected-child";
import { getWardAttendance, getWardTrend } from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type { TrendWindow, WardAttendance, WardTrend } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

const WINDOWS: TrendWindow[] = ["week", "month", "3m", "6m", "1y"];

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

function statusVariant(status: string): "success" | "destructive" | "warning" | "info" {
  if (status === "PRESENT") return "success";
  if (status === "ABSENT") return "destructive";
  if (status === "LATE") return "warning";
  return "info";
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("attendance");
  const label =
    status === "PRESENT"
      ? t("present")
      : status === "ABSENT"
        ? t("absent")
        : status === "LATE"
          ? t("late")
          : status === "EXCUSED"
            ? t("excused")
            : status;
  return <Badge variant={statusVariant(status)}>{label}</Badge>;
}

export function AttendanceClient() {
  const t = useTranslations("attendance");
  const tChildren = useTranslations("children");
  const tCommon = useTranslations("common");
  const tWindows = useTranslations("windows");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar" : "en-GB";
  const { children, selected, selectedId, loaded: childrenLoaded } = useSelectedChild();
  const [data, setData] = React.useState<WardAttendance | null>(null);
  const [window, setWindow] = React.useState<TrendWindow>("3m");
  const [trend, setTrend] = React.useState<WardTrend | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback((childId: string) => {
    if (!childId) {
      setLoading(false);
      return;
    }
    getWardAttendance(childId).then(
      (res) => {
        setData(res);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load attendance"));
        setLoading(false);
      },
    );
  }, []);

  const loadTrend = React.useCallback((childId: string, target: TrendWindow) => {
    if (!childId) return;
    getWardTrend(childId, "attendance", target).then(
      (res) => setTrend(res),
      () => setTrend(null),
    );
  }, []);

  React.useEffect(() => {
    if (!childrenLoaded) return;
    setLoading(true);
    load(selectedId);
    loadTrend(selectedId, window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenLoaded, selectedId]);

  React.useEffect(() => {
    if (!childrenLoaded || !selectedId) return;
    loadTrend(selectedId, window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const refreshAll = React.useCallback(() => {
    load(selectedId);
    loadTrend(selectedId, window);
  }, [load, loadTrend, selectedId, window]);
  useRealtimeEvent("attendance.marked", {
    onEvent: refreshAll,
    onReconnect: refreshAll,
  });
  useRealtimeEvent("attendance_updated", {
    onEvent: refreshAll,
    onReconnect: refreshAll,
  });

  function handleRetry() {
    setLoading(true);
    load(selectedId);
    loadTrend(selectedId, window);
  }

  if (!childrenLoaded || (loading && !data)) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
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
  const rate = data.summary.percentage;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {tChildren("viewing", { name: childName })}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck size={16} className="rounded-lg bg-[#D1FAE5] p-1 text-[#065F46]" aria-hidden />
              {t("attendanceRate")}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Trend window">
              {WINDOWS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={window === option ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => setWindow(option)}
                >
                  {tWindows(option)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold">
            {rate === null || rate === undefined ? "—" : `${rate}%`}
          </p>
          {trend && <TrendIndicator delta={trend.delta} series={trend.series} />}
          <p className="text-xs text-muted-foreground">
            {t("present")}: {data.summary.present} · {t("absent")}: {data.summary.absent} ·{" "}
            {t("late")}: {data.summary.late}
          </p>
        </CardContent>
      </Card>

      {data.records.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mt-2 text-sm font-medium">{t("noRecords")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ol className="divide-y">
              {data.records.map((record) => (
                <li
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{formatDate(record.date, dateLocale)}</p>
                    {record.subjectName && (
                      <p className="truncate text-xs text-muted-foreground">{record.subjectName}</p>
                    )}
                  </div>
                  <StatusBadge status={record.status} />
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
