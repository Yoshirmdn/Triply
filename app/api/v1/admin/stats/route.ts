import { withApi } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getAdminOverview } from "@/controller/admin.controller";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: "session", role: "SUPER_ADMIN" }, async () => {
  return ok(await getAdminOverview());
});