"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { BanknoteIcon, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectedChild } from "@/hooks/use-selected-child";
import { getWardFinance } from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type { LedgerInstallment, WardFinance } from "@/lib/api/types";

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

function money(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

const TOTAL_STATUS_KEY: Record<WardFinance["totals"]["status"], string> = {
  FULLY_PAID: "statusFullyPaid",
  PARTIALLY_PAID: "statusPartiallyPaid",
  OVERDUE: "statusOverdue",
};

const INSTALLMENT_STATUS_KEY: Record<LedgerInstallment["status"], string> = {
  PAID: "instPaid",
  PARTIAL: "instPartial",
  OVERDUE: "instOverdue",
  PENDING: "instPending",
};

const INSTALLMENT_BADGE_VARIANT: Record<LedgerInstallment["status"], "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "default",
  PARTIAL: "secondary",
  OVERDUE: "destructive",
  PENDING: "outline",
};

// Backend payment_method enum — displayed as-is, localized.
const METHOD_KEY: Record<string, string> = {
  CASH: "methodCash",
  BANKAK: "methodBankak",
  FAWRY: "methodFawry",
  OKASH: "methodOkash",
  AL_MASHRIQ: "methodAlMashriq",
};

function methodLabel(method: string, t: (key: string) => string): string {
  return t(METHOD_KEY[method] ?? "methodOther");
}

export function FinanceClient() {
  const t = useTranslations("finance");
  const tChildren = useTranslations("children");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar" : "en-GB";
  const { children, selected, selectedId, loaded: childrenLoaded } = useSelectedChild();
  const [data, setData] = React.useState<WardFinance | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback((childId: string) => {
    if (!childId) {
      setLoading(false);
      return;
    }
    getWardFinance(childId).then(
      (res) => {
        setData(res);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load finance"));
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
  const currency = data.totals.currency;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("subtitle")} · {tChildren("viewing", { name: childName })}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("title")}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm">{t("summary")}</CardTitle>
            <Badge variant={data.totals.status === "OVERDUE" ? "destructive" : data.totals.status === "FULLY_PAID" ? "default" : "secondary"}>
              {t(TOTAL_STATUS_KEY[data.totals.status])}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("assigned")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{money(data.totals.assigned, currency, locale)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("paid")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-700">{money(data.totals.paid, currency, locale)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("remaining")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{money(data.totals.balance, currency, locale)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("discountGiven")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{money(data.fee.totalDiscount, currency, locale)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-sm">{t("fees")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-lg border">
            {data.fee.rows.map((row) => (
              <li key={row.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium sm:flex-none sm:basis-48">{row.label}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {row.discount > 0 && (
                    <span>
                      {money(row.amount, currency, locale)} · {t("minusDiscount")} {money(row.discount, currency, locale)} ={" "}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-medium tabular-nums">{money(row.net, currency, locale)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-sm">{t("installments")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.installments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("noInstallments")}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {data.installments.map((inst) => (
                <li key={inst.no} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium sm:flex-none sm:basis-48">{inst.name}</span>
                  {inst.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {t("due")} {new Date(inst.dueDate).toLocaleDateString(dateLocale)}
                    </span>
                  )}
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {money(inst.paid, currency, locale)} / {money(inst.amount, currency, locale)}
                  </span>
                  <Badge variant={INSTALLMENT_BADGE_VARIANT[inst.status]}>{t(INSTALLMENT_STATUS_KEY[inst.status])}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BanknoteIcon size={16} aria-hidden /> {t("payments")}
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={() => window.print()} className="print:hidden">
              <Printer size={14} aria-hidden /> {tCommon("print")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("noPayments")}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {data.payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{payment.ref || "—"}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {payment.at ? new Date(payment.at).toLocaleDateString(dateLocale) : "—"} · {payment.target}
                  </span>
                  <span className="text-xs text-muted-foreground">{methodLabel(payment.method, t)}</span>
                  <span className="shrink-0 font-medium tabular-nums">{money(payment.amount, payment.currencyCode, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
