"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import { getGuardianProfile } from "@/lib/api/guardians";
import { ApiError } from "@/lib/api/client";
import type { GuardianProfile } from "@/lib/api/types";

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback;
}

export function ProfileClient() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [profile, setProfile] = React.useState<GuardianProfile | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [signingOut, setSigningOut] = React.useState(false);

  const load = React.useCallback(() => {
    getGuardianProfile().then(
      (res) => {
        setProfile(res);
        setError("");
        setLoading(false);
      },
      (cause: unknown) => {
        setError(errorMessage(cause, "Unable to load profile"));
        setLoading(false);
      },
    );
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    setSigningOut(true);
    try {
      await fetch("/api/session/logout", { method: "POST" });
    } catch {
      // Cookies may already be gone; still land on login.
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  if (loading && !profile) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if ((error && !profile) || (!loading && !profile)) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{error || tCommon("noData")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              load();
            }}
            disabled={loading}
          >
            {tCommon("retry")}
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <UserRound size={16} className="rounded-lg bg-[#E0E7FF] p-1 text-[#312E81]" aria-hidden />
            {t("guardianInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <div className="flex items-center justify-between gap-2 py-2 text-sm">
              <dt className="text-muted-foreground">{t("name")}</dt>
              <dd className="font-medium">{fullName}</dd>
            </div>
            {profile.phone && (
              <div className="flex items-center justify-between gap-2 py-2 text-sm">
                <dt className="text-muted-foreground">{t("phone")}</dt>
                <dd className="font-medium" dir="ltr">
                  {profile.phone}
                </dd>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center justify-between gap-2 py-2 text-sm">
                <dt className="text-muted-foreground">{t("email")}</dt>
                <dd className="truncate font-medium">{profile.email}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("relationship")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ol className="divide-y">
            {profile.relationships.map((link) => (
              <li
                key={link.studentId}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <span className="font-medium">
                  {t("perChild", { name: link.studentName })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Badge variant="secondary">{link.relationship}</Badge>
                  {link.isPrimary && <Badge variant="outline">{t("primary")}</Badge>}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <LanguageToggle />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void logout()}
            disabled={signingOut}
          >
            <LogOut size={14} aria-hidden /> {t("logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
