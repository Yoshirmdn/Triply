import { withApi } from "@/lib/api-handler";
import { noContent, ok } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/api-request";
import { tripUpdateSchema } from "@/lib/validations/trip.schema";
import { deleteTrip, getTrip, updateTrip } from "@/controller/trip.controller";

export const dynamic = "force-dynamic";

export const GET = withApi({ auth: "session" }, async ({ actor, params }) => {
  return ok(await getTrip(actor, params.id));
});

export const PATCH = withApi({ auth: "session" }, async ({ request, actor, params }) => {
  const patch = await parseJsonBody(request, tripUpdateSchema);
  return ok(await updateTrip(actor, params.id, patch));
});

export const DELETE = withApi({ auth: "session" }, async ({ actor, params }) => {
  await deleteTrip(actor, params.id);
  return noContent();
});