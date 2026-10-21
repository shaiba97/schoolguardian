import { NextResponse } from "next/server";
import { guardianApiUrl, GUARDIAN_TENANT_COOKIE, GUARDIAN_TOKEN_COOKIE } from "@/lib/api/session";

type Membership = {
  tenantId: string;
  status: string;
  tenant: { id: string; name: string };
  roles: Array<{ slug: string }>;
};

type LoginResponse = {
  accessToken: string;
  memberships: Membership[];
};

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function sessionCookies(token: string, tenantId: string) {
  const secure = process.env.NODE_ENV === "production";
  const base = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`;
  return [
    `${GUARDIAN_TOKEN_COOKIE}=${encodeURIComponent(token)}; ${base}`,
    `${GUARDIAN_TENANT_COOKIE}=${encodeURIComponent(tenantId)}; ${base}`,
  ];
}

/**
 * Guardian login. Guardians sign in with their guardian ID plus a password —
 * accounts are provisioned alongside admissions, so there is no self-signup
 * surface. The caller must hold a PARENT-role membership; when several
 * schools match, the frontend re-posts with an explicit tenantId.
 */
export async function POST(request: Request) {
  let body: { identifier?: string; password?: string; tenantId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }
  const identifier = body.identifier?.trim() ?? "";
  const password = body.password ?? "";
  if (!identifier || !password) {
    return NextResponse.json({ message: "Guardian ID and password are required" }, { status: 400 });
  }

  // Guardian sign in is guardian-ID only. The tenant must be known up front:
  // guardian numbers are unique per school, and unlike the email flow there
  // is no ambiguity recovery — a number resolves to exactly one guardian or none.
  const tenantId = body.tenantId ?? process.env.NEXT_PUBLIC_TENANT_ID ?? "";
  if (!tenantId) {
    return NextResponse.json(
      { message: "This school is not configured for guardian-ID sign in — contact academic affairs" },
      { status: 400 },
    );
  }

  const payload: Record<string, string> = {
    tenantId,
    guardianNumber: identifier,
  };
  payload.password = password;

  let upstream: Response;
  try {
    upstream = await fetch(guardianApiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Guardian API is unavailable" }, { status: 502 });
  }
  if (!upstream.ok) {
    const data = await upstream.json().catch(() => undefined);
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: unknown }).message)
        : "Sign in failed";
    return NextResponse.json({ message }, { status: upstream.status });
  }

  const data = (await upstream.json()) as LoginResponse;
  const parentMemberships = (data.memberships ?? []).filter(
    (m) => m.status === "ACTIVE" && m.roles.some((r) => r.slug === "PARENT"),
  );
  if (parentMemberships.length === 0) {
    return NextResponse.json(
      { message: "This account has no guardian access — accounts are provisioned through admissions" },
      { status: 403 },
    );
  }
  if (parentMemberships.length > 1 && !body.tenantId) {
    return NextResponse.json(
      {
        message: "Select your school",
        tenants: parentMemberships.map((m) => ({ id: m.tenantId, name: m.tenant.name })),
      },
      { status: 409 },
    );
  }
  const membership =
    parentMemberships.find((m) => m.tenantId === body.tenantId) ?? parentMemberships[0];

  const response = NextResponse.json({
    ok: true,
    tenant: { id: membership.tenantId, name: membership.tenant.name },
  });
  for (const cookie of sessionCookies(data.accessToken, membership.tenantId)) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}

