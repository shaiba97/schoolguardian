"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE, type PortalLocale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

function setLocaleCookie(locale: PortalLocale) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax${secure}`;
}

/**
 * Header language toggle. Persists to a cookie and refreshes the RSC tree —
 * server components (including <html lang/dir>) re-render without a full
 * page reload.
 */
export function LanguageToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const router = useRouter();
  const locale = useLocale() as PortalLocale;
  const t = useTranslations("header");
  const [pending, setPending] = React.useState(false);

  function toggle() {
    const next: PortalLocale = locale === "ar" ? "en" : "ar";
    setPending(true);
    setLocaleCookie(next);
    router.refresh();
    // Refresh is async; release the pressed state shortly after.
    window.setTimeout(() => setPending(false), 800);
  }

  const label = locale === "ar" ? t("english") : t("arabic");

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggle}
        disabled={pending}
        aria-label={t("language")}
        title={t("language")}
        className={cn("shrink-0 text-white/70 hover:text-white hover:bg-white/10", className)}
      >
        <Languages size={16} aria-hidden />
        {locale === "ar" ? "EN" : "عربي"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-label={t("language")}
      title={t("language")}
      className={cn(className)}
    >
      <Languages size={14} aria-hidden />
      {label}
    </Button>
  );
}
