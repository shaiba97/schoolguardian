"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { GuardianChild } from "@/lib/api/types";

export function ChildSwitcher({
  wards,
  selectedId,
  onSelect,
  className,
}: {
  wards: GuardianChild[];
  selectedId: string;
  onSelect: (childId: string) => void;
  className?: string;
}) {
  const t = useTranslations("children");

  // One linked child: show the name, no pointless dropdown.
  if (wards.length <= 1) {
    const only = wards[0];
    return (
      <p className={cn("truncate text-sm font-medium", className)} aria-live="polite">
        {only ? only.fullName : t("noChildren")}
      </p>
    );
  }

  return (
    <label className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className="sr-only">{t("selectChild")}</span>
      <select
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        aria-label={t("selectChild")}
        className="h-9 min-w-0 max-w-44 truncate rounded-lg border border-input bg-card px-2 py-1 text-sm font-medium shadow-sm"
      >
        {wards.map((child) => (
          <option key={child.id} value={child.id}>
            {child.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}
