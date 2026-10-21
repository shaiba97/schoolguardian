export const LOCALES = ["en", "ar"] as const;
export type PortalLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: PortalLocale = "en";

/** Cookie carrying the guardian's UI language (no locale URL prefix). */
export const LOCALE_COOKIE = "gp_locale";

export function isPortalLocale(value: unknown): value is PortalLocale {
  return value === "en" || value === "ar";
}

export function directionOf(locale: PortalLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
