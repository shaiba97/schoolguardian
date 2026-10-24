"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import {
  Bell,
  CalendarCheck,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Table2,
  UserRound,
  BanknoteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/results", labelKey: "results", icon: GraduationCap },
  { href: "/timetables", labelKey: "timetables", icon: Table2 },
  { href: "/attendance", labelKey: "attendance", icon: CalendarCheck },
  { href: "/finance", labelKey: "finance", icon: BanknoteIcon },
  { href: "/notifications", labelKey: "notifications", icon: Bell },
  { href: "/cases", labelKey: "cases", icon: FolderOpen },
  { href: "/profile", labelKey: "profile", icon: UserRound },
] as const;

function withChild(href: string, studentId: string) {
  return studentId ? `${href}?studentId=${encodeURIComponent(studentId)}` : href;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("nav");
  const th = useTranslations("header");
  const studentId = searchParams.get("studentId") ?? "";

  return (
    <aside
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground p-4 md:flex print:hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate px-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground">
          {th("portalName")}
        </p>
        <LanguageToggle
          compact
          className="border-transparent bg-transparent text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"
        />
      </div>
      <nav aria-label={th("portalName")} className="mt-4 flex flex-1 flex-col gap-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={withChild(item.href, studentId)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-sidebar-active-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
              )}
            >
              {active ? (
                <span className="w-1 shrink-0 rounded-r bg-emerald-200" aria-hidden />
              ) : null}
              <Icon size={18} className={active ? undefined : "text-indigo-200"} aria-hidden />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <LogoutButton />
    </aside>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("header");
  const [pending, setPending] = React.useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/session/logout", { method: "POST" });
    } catch {
      // Cookies may already be gone; still land on login.
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={pending}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground disabled:opacity-50",
        className,
      )}
    >
      <UserRound size={18} aria-hidden />
      {t("logout")}
    </button>
  );
}
