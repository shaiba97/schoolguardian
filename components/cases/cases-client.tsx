"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectedChild } from "@/hooks/use-selected-child";
import { getWardCases } from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type { WardCases } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

export function CasesClient() {
  const t = useTranslations("cases");
  const tChildren = useTranslations("children");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar" : "en-GB";
  const { children, selected, selectedId, loaded: childrenLoaded } = useSelectedChild();
  const [data, setData] = React.useState<WardCases | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback((childId: string) => {
    if (!childId) {
      setLoading(false);
      return;
    }
    getWardCases(childId).then(
      (res) => {
        setData(res);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load cases"));
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
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
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

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {tChildren("viewing", { name: childName })}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      {data.cases.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FolderOpen size={20} className="mx-auto text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium">{t("noCases")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.cases.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderOpen size={16} className="rounded-lg bg-[#E0E7FF] p-1 text-[#312E81]" aria-hidden /> {item.title}
          </CardTitle>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("filed", { date: formatDate(item.filedAt, dateLocale) })}
                  {item.resolvedAt
                    ? ` · ${t("resolved", { date: formatDate(item.resolvedAt, dateLocale) })}`
                    : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{item.description}</p>
                <p className="text-xs text-muted-foreground">
                  {t("filedBy", { name: item.filedByName })}
                </p>
                {item.resolutionNote && (
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("resolution")}
                    </p>
                    <p className="mt-1 text-sm">{item.resolutionNote}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
