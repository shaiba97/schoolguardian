"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, FolderOpen, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { listGuardianNotifications } from "@/lib/api/guardians";

/**
 * Mobile top bar: language toggle, notifications bell, cases, profile.
 * Ward and guardian names stay off this bar by design — ward switching lives
 * on the dashboard, profile opens from its icon.
 */
export function MobileTopBar() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");
  const [unread, setUnread] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  // Badge data is mobile-only (desktop keeps the sidebar entry): no fetch,
  // no unread state, and no stale badge on larger screens. Revalidates on
  // every route change so reading items in the inbox clears it.
  React.useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
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

  const showBadge = loaded && unread > 0;
  const casesActive = pathname === "/cases" || pathname.startsWith("/cases/");
  const profileActive = pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-[#C7D2FE] bg-[#E0E7FF] text-foreground print:hidden md:hidden">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-1.5 px-3">
        <p className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wider text-foreground">
          {tHeader("portalName")}
        </p>
        <LanguageToggle compact className="border-transparent bg-transparent text-foreground hover:bg-white/60" />
        <Link
          href="/notifications"
          aria-label={tNav("notifications")}
          className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#4338CA] hover:bg-white/60 hover:text-[#4338CA]"
        >
          <Bell size={20} aria-hidden />
          {showBadge && (
            <span className="absolute -right-0.5 -top-0.5 size-5 rounded-full bg-[#FB923C]" aria-hidden />
          )}
        </Link>
        <Link
          href="/cases"
          aria-current={casesActive ? "page" : undefined}
          aria-label={tNav("cases")}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#4338CA] hover:bg-white/60",
            casesActive ? "font-semibold" : "",
          )}
        >
          <FolderOpen size={20} aria-hidden />
        </Link>
        <Link
          href="/profile"
          aria-current={profileActive ? "page" : undefined}
          aria-label={tNav("profile")}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[#4338CA] hover:bg-white/60",
            profileActive ? "font-semibold" : "",
          )}
        >
          <UserRound size={20} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
