"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Search, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listGuardianNotifications } from "@/lib/api/guardians";

/**
 * Desktop top bar: search, notifications, profile.
 * Mirrors the mobile top bar's destinations so both shells navigate alike,
 * but keeps the search input (desktop-only affordance) out of the mobile bar.
 */
export function PortalTopBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [unread, setUnread] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    listGuardianNotifications().then(
      (items) => {
        if (cancelled) return;
        const list = Array.isArray(items) ? items : [];
        setUnread(list.filter((item) => !item.readAt).length);
        setLoaded(true);
      },
      () => {
        if (cancelled) return;
        setLoaded(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const showDot = loaded && unread > 0;
  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <div
      className="hidden md:flex sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#C7D2FE] bg-[#E0E7FF] text-foreground"
    >
      <div className="flex w-full max-w-6xl mx-auto items-center gap-4 px-4 md:px-6">
        <div className="flex items-center gap-2 flex-1 max-w-[340px] shrink-0">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4338CA]" aria-hidden />
          <Input
            type="search"
            placeholder={t("common.search")}
            className="pl-8 pr-3 text-sm border border-input bg-card text-foreground focus-visible:border-primary focus-visible:ring-primary/20 shrink-0"
          />
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Link
            href="/notifications"
            aria-label={t("notifications")}
            className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#4338CA] hover:bg-white/60"
          >
            <Bell size={20} aria-hidden />
            {showDot && (
              <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#FB923C]" aria-hidden />
            )}
          </Link>
          <span className="hidden sm:flex h-4 w-px bg-[#C7D2FE]" aria-hidden />
          <Link
            href="/profile"
            aria-current={profileActive ? "page" : undefined}
            aria-label={t("profile")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-white/60",
              profileActive ? "font-semibold" : "",
            )}
          >
            <UserRound size={18} aria-hidden />
            <span className="hidden sm:inline">{t("profile")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
