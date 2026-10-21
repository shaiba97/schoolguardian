import { NextResponse } from "next/server";
import { GUARDIAN_TENANT_COOKIE, GUARDIAN_TOKEN_COOKIE } from "@/lib/api/session";

export async function POST() {
  const secure = process.env.NODE_ENV === "production";
  const base = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
  const response = NextResponse.json({ ok: true });
  response.headers.append("Set-Cookie", `${GUARDIAN_TOKEN_COOKIE}=; ${base}`);
  response.headers.append("Set-Cookie", `${GUARDIAN_TENANT_COOKIE}=; ${base}`);
  return response;
}

