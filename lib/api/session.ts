const API_URL = process.env.GUARDIAN_API_URL || "http://localhost:3000/api";

export const GUARDIAN_AUTH_HEADER = "authorization";
export const GUARDIAN_TENANT_HEADER = "x-tenant-id";
/** Session cookie names (populated by the login slice; auth comes last). */
export const GUARDIAN_TOKEN_COOKIE = "gp_token";
export const GUARDIAN_TENANT_COOKIE = "gp_tenant";

export class GuardianSessionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GuardianSessionError";
    this.status = status;
  }
}

/** Dev bypass mirroring the backend's AUTH_NO_SESSION: unauthenticated local work. */
const NO_SESSION = process.env.GUARDIAN_NO_AUTH === "true";

export function guardianRequestHeaders(source: Headers) {
  const authorization = source.get(GUARDIAN_AUTH_HEADER);
  const tenantId = source.get(GUARDIAN_TENANT_HEADER);

  if (NO_SESSION) {
    return {
      authorization: authorization || "",
      tenantId: tenantId || process.env.NEXT_PUBLIC_TENANT_ID || "",
    };
  }
  if (!authorization) throw new GuardianSessionError("Guardian session is missing", 401);
  if (!tenantId) throw new GuardianSessionError("Guardian tenant is missing", 403);
  return { authorization, tenantId };
}

/**
 * Cookie-first resolution for the browser proxy: the login slice stores the
 * JWT + tenant in httpOnly cookies (invisible to JS), so the proxy route
 * reads them here and forwards them as headers. Direct headers still win
 * when present (server-to-server calls, dev tools).
 */
export async function getProxySession(request: Request) {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const headerAuth = request.headers.get(GUARDIAN_AUTH_HEADER);
  const headerTenant = request.headers.get(GUARDIAN_TENANT_HEADER);
  const authorization =
    headerAuth || (jar.get(GUARDIAN_TOKEN_COOKIE)?.value ? `Bearer ${jar.get(GUARDIAN_TOKEN_COOKIE)?.value}` : "");
  const tenantId = headerTenant || jar.get(GUARDIAN_TENANT_COOKIE)?.value || "";
  return guardianRequestHeaders(
    new Headers({
      ...(authorization ? { [GUARDIAN_AUTH_HEADER]: authorization } : {}),
      ...(tenantId ? { [GUARDIAN_TENANT_HEADER]: tenantId } : {}),
    }),
  );
}

export async function getIncomingGuardianHeaders() {
  const { headers } = await import("next/headers");
  return guardianRequestHeaders(await headers());
}

export function guardianApiUrl(path: string) {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
