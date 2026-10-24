"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Four primary destinations: Dashboard, Results, Timetables, Attendance.
// Notifications and Cases live in the top bar; Profile opens from
// the guardian name; the desktop sidebar keeps the rest.
const ITEMS = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/results", labelKey: "results", icon: GraduationCap },
  { href: "/timetables", labelKey: "timetables", icon: Table2 },
  { href: "/attendance", labelKey: "attendance", icon: CalendarCheck },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("nav");
  const studentId = searchParams.get("studentId") ?? "";

  return (
    <nav
      aria-label="Guardian portal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#312E81] print:hidden md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-4 px-1 pt-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const href = studentId
            ? `${item.href}?studentId=${encodeURIComponent(studentId)}`
            : item.href;
          return (
            <Link
              key={item.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-white border-b-2 border-indigo-300" : "text-[#C7D2FE] hover:text-white",
              )}
            >
              <Icon size={20} aria-hidden />
              <span className="w-full truncate text-center leading-tight">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
