"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e bg-background p-4 md:flex print:hidden">
      <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {th("portalName")}
      </p>
      <nav aria-label="Guardian portal" className="mt-4 flex flex-1 flex-col gap-1">
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
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={18} aria-hidden />
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
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
        className,
      )}
    >
      <UserRound size={18} aria-hidden />
      {t("logout")}
    </button>
  );
}
