import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api-response";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", database: "connected" });
  } catch {
    return fail(new ApiError("INTERNAL_ERROR", "Database unreachable"));
  }
}
