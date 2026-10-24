"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/i18n/language-toggle";

type TenantOption = { id: string; name: string };

type LoginResult =
  | { ok: true }
  | { ok: false; message: string; tenants?: TenantOption[] };

async function postLogin(identifier: string, password: string, tenantId?: string): Promise<LoginResult> {
  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: identifier.trim(),
      password,
      ...(tenantId ? { tenantId } : {}),
    }),
  });
  if (response.ok) return { ok: true };
  const data = await response.json().catch(() => undefined);
  const message =
    typeof data === "object" && data && "message" in data
      ? String((data as { message: unknown }).message)
      : "Sign in failed";
  const tenants =
    response.status === 409 && data && typeof data === "object" && "tenants" in data && Array.isArray((data as { tenants: unknown }).tenants)
      ? ((data as { tenants: TenantOption[] }).tenants ?? [])
      : undefined;
  return { ok: false, message, tenants };
}

export function LoginClient() {
  const router = useRouter();
  const t = useTranslations("login");
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [tenants, setTenants] = React.useState<TenantOption[]>([]);
  const [tenantId, setTenantId] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(selectedTenantId?: string) {
    setPending(true);
    setError("");
    try {
      const result = await postLogin(identifier, password, selectedTenantId);
      if (!result.ok && result.tenants && result.tenants.length > 0) {
        setTenants(result.tenants);
        setError("");
        return;
      }
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t("unavailable"));
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!identifier.trim() || !password) {
      setError(t("required"));
      return;
    }
    void submit(tenantId || undefined);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center p-4">
      <div className="mb-2 flex justify-end print:hidden">
        <LanguageToggle />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogIn size={16} className="text-muted-foreground" aria-hidden />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-guardian-id">{t("guardianId")}</Label>
              <Input
                id="login-guardian-id"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={t("guardianIdPlaceholder")}
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-password">{t("password")}</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {tenants.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-tenant">{t("school")}</Label>
                <select
                  id="login-tenant"
                  value={tenantId}
                  onChange={(event) => setTenantId(event.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="">{t("selectSchool")}</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={pending || !identifier.trim() || !password || (tenants.length > 0 && !tenantId)}
            >
              {pending ? t("signingIn") : tenants.length > 0 ? t("continue") : t("signIn")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {t("noSignup")}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
