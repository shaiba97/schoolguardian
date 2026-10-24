"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CalendarCheck,
  GraduationCap,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeEvent } from "@/lib/realtime/socket";
import { TrendIndicator } from "@/components/trends/trend-indicator";
import { useSelectedChild } from "@/hooks/use-selected-child";
import {
  getWardAttendance,
  getWardResults,
  getWardTrend,
} from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type {
  TrendWindow,
  WardAttendance,
  WardResults,
  WardTrend,
} from "@/lib/api/types";

const WINDOWS: TrendWindow[] = ["week", "month", "3m", "6m", "1y"];

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

function withChild(href: string, studentId: string) {
  return studentId ? `${href}?studentId=${encodeURIComponent(studentId)}` : href;
}

export function DashboardClient() {
  const t = useTranslations("dashboard");
  const tChildren = useTranslations("children");
  const tCommon = useTranslations("common");
  const tWindows = useTranslations("windows");
  const { children, selected, selectedId, loaded: childrenLoaded, select } = useSelectedChild();
  const [results, setResults] = React.useState<WardResults | null>(null);
  const [attendance, setAttendance] = React.useState<WardAttendance | null>(null);
  const [window, setWindow] = React.useState<TrendWindow>("3m");
  const [resultsTrend, setResultsTrend] = React.useState<WardTrend | null>(null);
  const [attendanceTrend, setAttendanceTrend] = React.useState<WardTrend | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback((childId: string) => {
    if (!childId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getWardResults(childId), getWardAttendance(childId)]).then(
      ([resultsRes, attendanceRes]) => {
        setResults(resultsRes);
        setAttendance(attendanceRes);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load dashboard"));
        setLoading(false);
      },
    );
  }, []);

  const loadTrends = React.useCallback((childId: string, target: TrendWindow) => {
    if (!childId) return;
    Promise.all([
      getWardTrend(childId, "results", target),
      getWardTrend(childId, "attendance", target),
    ]).then(
      ([resultsRes, attendanceRes]) => {
        setResultsTrend(resultsRes);
        setAttendanceTrend(attendanceRes);
      },
      () => {
        setResultsTrend(null);
        setAttendanceTrend(null);
      },
    );
  }, []);

  React.useEffect(() => {
    if (!childrenLoaded) return;
    load(selectedId);
    loadTrends(selectedId, window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenLoaded, selectedId]);

  React.useEffect(() => {
    if (!childrenLoaded || !selectedId) return;
    loadTrends(selectedId, window);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const refreshAll = React.useCallback(() => {
    load(selectedId);
    loadTrends(selectedId, window);
  }, [load, loadTrends, selectedId, window]);
  useRealtimeEvent(
    ["marks.entered", "exam.published", "attendance.marked", "notification.created"],
    {
      onEvent: refreshAll,
      onReconnect: refreshAll,
    },
  );

  function handleRetry() {
    setLoading(true);
    load(selectedId);
    loadTrends(selectedId, window);
  }

  if (!childrenLoaded || (loading && !results)) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
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

  const childName = selected?.fullName ?? "";
  const resultsAvg = results?.averagePercentage ?? null;
  const attendanceRate = attendance?.summary.percentage ?? null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {tChildren("viewing", { name: childName })}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      {children.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-ward" className="sr-only">
            {tChildren("selectChild")}
          </label>
          <select
            id="dashboard-ward"
            value={selectedId}
            onChange={(event) => select(event.target.value)}
            aria-label={tChildren("selectChild")}
            className="h-10 min-w-0 max-w-xs truncate rounded-lg border border-input bg-card px-3 py-1 text-sm font-medium shadow-sm"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry} disabled={loading}>
            {tCommon("retry")}
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap size={16} className="rounded-lg bg-[#E0E7FF] p-1 text-[#312E81]" aria-hidden />
              {t("resultsSummary", { name: childName })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {resultsAvg === null || resultsAvg === undefined ? "—" : `${resultsAvg}%`}
            </p>
            {resultsTrend && (
              <TrendIndicator delta={resultsTrend.delta} series={resultsTrend.series} />
            )}
            <Link
              href={withChild("/results", selectedId)}
              className={buttonVariants({ variant: "link", size: "sm" }) + " h-auto p-0"}
            >
              {t("viewResults")}{" "}
              <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarCheck size={16} className="rounded-lg bg-[#D1FAE5] p-1 text-[#065F46]" aria-hidden />
              {t("attendanceSummary", { name: childName })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold">
              {attendanceRate === null || attendanceRate === undefined ? "—" : `${attendanceRate}%`}
            </p>
            {attendanceTrend && (
              <TrendIndicator delta={attendanceTrend.delta} series={attendanceTrend.series} />
            )}
            <Link
              href={withChild("/attendance", selectedId)}
              className={buttonVariants({ variant: "link", size: "sm" }) + " h-auto p-0"}
            >
              {t("viewAttendance")}{" "}
              <ArrowRight size={14} aria-hidden className="rtl:rotate-180" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm">{t("overall")}</CardTitle>
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
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm font-medium">{t("tests")}</span>
            {resultsTrend ? (
              <TrendIndicator delta={resultsTrend.delta} series={resultsTrend.series} />
            ) : (
              <span className="text-xs text-muted-foreground">{tCommon("unavailable")}</span>
            )}
            {resultsTrend &&
              (resultsTrend.byType.test.samples > 0 || resultsTrend.byType.exam.samples > 0) && (
                <p className="w-full text-xs text-muted-foreground">
                  {t("tests")}{" "}
                  <span className="font-medium text-foreground">
                    {resultsTrend.byType.test.average ?? "—"}
                    {resultsTrend.byType.test.average !== null &&
                      resultsTrend.byType.test.average !== undefined &&
                      "%"}
                  </span>{" "}
                  ({resultsTrend.byType.test.samples}) · {t("exams")}{" "}
                  <span className="font-medium text-foreground">
                    {resultsTrend.byType.exam.average ?? "—"}
                    {resultsTrend.byType.exam.average !== null &&
                      resultsTrend.byType.exam.average !== undefined &&
                      "%"}
                  </span>{" "}
                  ({resultsTrend.byType.exam.samples})
                </p>
              )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm font-medium">{t("attendanceSummary", { name: childName })}</span>
            {attendanceTrend ? (
              <TrendIndicator delta={attendanceTrend.delta} series={attendanceTrend.series} />
            ) : (
              <span className="text-xs text-muted-foreground">{tCommon("unavailable")}</span>
            )}
            {attendanceTrend?.current?.average !== null &&
              attendanceTrend?.current?.average !== undefined && (
                <p className="w-full text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {attendanceTrend.current.average}%
                  </span>{" "}
                  {t("acrossSessions", { count: attendanceTrend.current.samples })}
                </p>
              )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={withChild("/results", selectedId)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("viewResults")}
            </Link>
            <Link
              href={withChild("/timetables", selectedId)}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " h-auto p-0 bg-[#FB923C]/10 text-[#C2410C] hover:bg-[#FB923C]/20"}
            >
              {t("viewTimetable")}
            </Link>
            <Link
              href={withChild("/attendance", selectedId)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("viewAttendance")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
