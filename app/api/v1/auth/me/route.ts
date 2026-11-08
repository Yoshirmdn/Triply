import { withApi } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: "session" }, async ({ actor }) => {
  return ok({ id: actor.id, email: actor.email, name: actor.name, role: actor.role });
});