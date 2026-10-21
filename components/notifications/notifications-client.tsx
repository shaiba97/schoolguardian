"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeEvent } from "@/lib/realtime/socket";
import {
  listGuardianNotifications,
  markAllGuardianNotificationsRead,
  markGuardianNotificationRead,
} from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type { GuardianNotification } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

export function NotificationsClient() {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "ar" ? "ar" : "en-GB";
  const [items, setItems] = React.useState<GuardianNotification[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(() => {
    listGuardianNotifications().then(
      (res) => {
        setItems(Array.isArray(res) ? res : []);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load notifications"));
        setLoading(false);
      },
    );
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // A pushed notification refreshes the feed; REST stays the source of truth.
  useRealtimeEvent("notification.created", {
    onEvent: load,
    onReconnect: load,
  });

  function handleRetry() {
    setLoading(true);
    load();
  }

  async function handleRead(id: string) {
    try {
      await markGuardianNotificationRead(id);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
    } catch (cause) {
      setError(errorMessage(cause, "Unable to mark notification read"));
    }
  }

  async function handleReadAll() {
    try {
      await markAllGuardianNotificationsRead();
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? now })));
    } catch (cause) {
      setError(errorMessage(cause, "Unable to mark notifications read"));
    }
  }

  const unread = items.filter((item) => !item.readAt).length;

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        {unread > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => void handleReadAll()}>
            {t("markAllRead")}
          </Button>
        )}
      </div>

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

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell size={20} className="mx-auto text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium">{t("noNotifications")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {unread > 0 && (
            <p className="text-xs text-muted-foreground" role="status">
              {t("unread", { count: unread })}
            </p>
          )}
          {items.map((item) => (
            <Card key={item.id} className={item.readAt ? "opacity-80" : undefined}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(item.createdAt, dateLocale)}
                  </p>
                </div>
                {!item.readAt && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleRead(item.id)}
                  >
                    {t("markRead")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
