import { withApi } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: "guard" }, async () => {
  return ok({ status: "guard-ok" });
});