import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUARDIAN_NO_AUTH_BYPASS } from "./lib/auth-flag";
import { GUARDIAN_TOKEN_COOKIE } from "./lib/api/session";

const PORTAL_PATHS = [
  "/dashboard",
  "/results",
  "/attendance",
  "/timetables",
  "/notifications",
  "/cases",
  "/profile",
];

/**
 * Portal guard (Next 16 `proxy` convention): cookie presence only. Token
 * validity is enforced per request by the backend (401s redirect to /login
 * client-side).
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPortalPath = PORTAL_PATHS.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
  const token = request.cookies.get(GUARDIAN_TOKEN_COOKIE)?.value;

  if (GUARDIAN_NO_AUTH_BYPASS) return NextResponse.next();

  if (isPortalPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/results",
    "/attendance",
    "/timetables",
    "/notifications",
    "/cases",
    "/profile",
    "/dashboard/:path*",
    "/results/:path*",
    "/attendance/:path*",
    "/timetables/:path*",
    "/notifications/:path*",
    "/cases/:path*",
    "/profile/:path*",
    "/login",
  ],
};
