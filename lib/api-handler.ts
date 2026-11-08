import "server-only";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";
import { GUARD_CHALLENGE, hasGuardHeader, verifyApiGuard } from "@/lib/api-guard";
import { requireRole, requireUser } from "@/lib/permissions";
import type { Actor, AppRole } from "@/@type/auth";

type SessionOptions = { auth: "session"; role?: AppRole };
type OtherOptions = { auth: "public" | "guard" | "either" };
type ApiOptions = SessionOptions | OtherOptions;

type BaseContext = {
  request: NextRequest;
  params: Record<string, string>;
};

type SessionContext = BaseContext & { actor: Actor; via: "session" };
type OtherContext = BaseContext & { actor: Actor | null; via: "session" | "guard" | "public" };

export type ApiContext<O extends ApiOptions> = O extends SessionOptions ? SessionContext : OtherContext;

type RouteContext = { params: Promise<Record<string, string>> };

async function authenticate(request: NextRequest, options: ApiOptions) {
  if (options.auth === "public") {
    return { actor: null, via: "public" as const };
  }

  if (options.auth === "session") {
    const actor = options.role ? await requireRole(options.role) : await requireUser();
    return { actor, via: "session" as const };
  }

  if (options.auth === "guard") {
    if (!verifyApiGuard(request)) throw new ApiError("UNAUTHORIZED", "Kredensial API tidak valid");
    return { actor: null, via: "guard" as const };
  }

  const session = await auth();
  if (session?.user?.id) {
    const actor = await requireUser();
    return { actor, via: "session" as const };
  }
  if (hasGuardHeader(request)) {
    if (!verifyApiGuard(request)) throw new ApiError("UNAUTHORIZED", "Kredensial API tidak valid");
    return { actor: null, via: "guard" as const };
  }
  throw new ApiError("UNAUTHORIZED", "Autentikasi diperlukan");
}

export function withApi<O extends ApiOptions>(
  options: O,
  handler: (context: ApiContext<O>) => Promise<Response>,
) {
  return async (request: NextRequest, routeContext: RouteContext): Promise<Response> => {
    try {
      const params = await routeContext.params;
      const { actor, via } = await authenticate(request, options);
      return await handler({ request, params, actor, via } as unknown as ApiContext<O>);
    } catch (error) {
      const response = fail(error);
      const usesGuard = options.auth === "guard" || options.auth === "either";
      if (response.status === 401 && usesGuard) {
        response.headers.set("WWW-Authenticate", GUARD_CHALLENGE);
      }
      return response;
    }
  };
}