import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProxySession, guardianApiUrl, GuardianSessionError } from "@/lib/api/session";

/**
 * Exchanges the httpOnly session cookies for a short-lived socket ticket.
 * Uses the cookie-first proxy session (never headers-only: browsers send
 * cookies, not Authorization headers, so a headers-only resolution would
 * 401 every real browser call). The session JWT itself never reaches JS —
 * the ticket is audience-scoped to `socket` with a short TTL.
 */
export async function GET(request: NextRequest) {
  let session: Awaited<ReturnType<typeof getProxySession>>;
  try {
    session = await getProxySession(request);
  } catch (error) {
    if (error instanceof GuardianSessionError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }

  let upstream: Response;
  try {
    upstream = await fetch(guardianApiUrl("/parents/me/socket-ticket"), {
      headers: {
        Accept: "application/json",
        Authorization: session.authorization,
        "X-Tenant-Id": session.tenantId,
      },
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
        : "Could not issue a socket ticket";
    return NextResponse.json({ message }, { status: upstream.status });
  }
  return NextResponse.json(await upstream.json());
}

